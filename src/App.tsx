import React, { FC, useState, useEffect } from 'react';
import styled from 'styled-components';

import './App.css';

const imagesUrl = 'https://images.tmdb.org/t/p/original/';

/**
 * The API endpoints the application depends on.
 */
const requests = {
  fetchTrending: `/trending/all/week?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`,
  fetchNetflixOriginals: `/discover/tv?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_networks=213`,
  fetchTopRated: `/movie/top_rated?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`,
  fetchActionMovies: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=28`,
  fetchComedyMovies: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=35`,
  fetchHorrorMovies: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=28`,
  fetchRomanceMovies: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=10749`,
  fetchDocumentaries: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=99`,
};

/**
 * Get a resource. If not from storage, then it is fetched and cached.
 * Provides basic error logging.
 */
const get = <T extends unknown>(url: string): Promise<T> =>
  preferStorage(url, () =>
    fetch(`https://api.themoviedb.org/3${url}`)
      .then((response) => {
        if (!response.ok) throw Error(`Response not okay: ${response}`);
        return response.json();
      })
      .catch((error) => {
        console.error('Failed to fetch:', error);
      })
  );

/**
 * Used to de-duplicate "expensive" network interaction by caching results.
 */
const preferStorage = async <T extends unknown>(
  resourceKey: string,
  getResource: () => Promise<T>
): Promise<T> => {
  const stored = window.localStorage.getItem(resourceKey);
  if (stored) return JSON.parse(stored);
  const resource = await getResource();
  window.localStorage.setItem(resourceKey, JSON.stringify(resource));
  return resource;
};

enum Pad {
  XSmall = '0.25rem',
  Small = '0.5rem',
  Medium = '1rem',
  Large = '2rem',
  XLarge = '3rem',
}

const Posters = styled.div`
  display: flex;
  overflow-y: hidden;
  overflow-x: scroll; // Netflix mode!
  padding: ${Pad.Medium};

  & > *:not(:last-child) {
    margin-right: ${Pad.Medium};
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Poster = styled.img`
  width: 100%;
  object-fit: contain;
  max-height: ${(props: { large?: boolean }) =>
    props.large ? '250px' : '100px'};
  transition: transform 400ms;

  &:hover {
    transform: scale(
      ${(props: { large?: boolean }) => (props.large ? 1.09 : 1.08)}
    );
  }
`;

const MovieRowContainer = styled.div`
  margin-left: ${Pad.Medium};

  h4 {
    margin: ${Pad.XSmall};
  }
`;

/**
 * Used to represent individual objects (like Movie) coming from the API.
 */
type ApiItem = Record<string, unknown>;

const MovieRow: FC<{
  title: string;
  fetchUrl: string;
  large?: boolean;
}> = ({ title, fetchUrl, large }) => {
  const [movies, setMovies] = useState<ApiItem[]>([]);

  // Fetch and display the content for the given url
  useEffect(() => {
    let subscribed = true;
    get<{ results: ApiItem[] }>(fetchUrl)
      .then((response) => {
        if (!subscribed) return;
        setMovies(response.results);
      })
      .catch(() => {
        if (!subscribed) return;
        setMovies([]);
      });
    return () => {
      subscribed = false;
    };
  }, [fetchUrl]);

  return (
    <MovieRowContainer>
      <h4>{title}</h4>
      <Posters>
        {movies.map((movie) => (
          <Poster
            key={movie.id as number}
            large={large}
            src={
              imagesUrl +
              '/' +
              (large ? movie.poster_path : movie.backdrop_path)
            }
            alt={movie.name as string}
          />
        ))}
      </Posters>
    </MovieRowContainer>
  );
};

/**
 * Ensure the given string `str` fits into the given length `limit`, replacing
 * the overflow with "..." if necessary.
 */
const truncate = (limit: number, str: string): string =>
  str?.length > limit ? str?.substr(0, limit - 1) + '...' : str;

/**
 * Select a random element (or return `null` if empty) from the given array.
 */
const randomFrom = <T extends unknown>(array: T[]): T | null => {
  if (array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length - 1);
  return array[randomIndex];
};

const BannerContainer = styled.header`
  background-size: cover;
  background-position: center center;
  background-image: ${(props: { backgroundUrl: string }) =>
    `url(${props.backgroundUrl})`};
  color: white;
  object-fit: contain;
  height: 448px;
`;

const BannerContent = styled.div`
  margin-left: 30px;
  padding-top: 140px;
  height: 190px;

  h1 {
    font-size: 3rem;
    font-weight: 600;
    padding-bottom: ${Pad.XSmall};
  }
`;

const BannerButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;

  & > *:not(:last-child) {
    margin-right: ${Pad.Medium};
  }
`;

const BannerButton = styled.button`
  cursor: pointer;
  color: #fff;
  outline: none;
  border: none;
  font-weight: 700;
  border-radius: 2px;
  padding: ${Pad.Small} ${Pad.Large};
  background-color: rgba(50, 50, 50, 0.5);

  &:hover {
    color: #000;
    background-color: #e6e6e6;
    transition: all 200ms;
  }
`;

const BannerDescription = styled.p`
  width: 45rem;
  line-height: 1.3;
  padding-top: ${Pad.Medium};
  font-size: 0.8rem;
  max-width: 360px;
  height: 80px;
  text-shadow: #000 0 0 8px;
`;

const BannerFade = styled.div`
  width: 100%;
  height: 7.4rem;
  background-image: linear-gradient(
    180deg,
    transparent,
    rgba(40, 40, 40, 0.6),
    #111
  );
`;

const Banner: FC = () => {
  const [movie, setMovie] = useState<ApiItem | null>(null);
  useEffect(() => {
    let subscribed = true;
    get<{ results: ApiItem[] }>(requests.fetchNetflixOriginals)
      .then((response) => {
        if (!subscribed) return;
        setMovie(randomFrom(response.results));
      })
      .catch((error) => {
        if (!subscribed) return;
        console.error('error is:', error);
      });
    return () => {
      subscribed = false;
    };
  }, []);
  return (
    <BannerContainer backgroundUrl={imagesUrl + movie?.backdrop_path}>
      <BannerContent>
        <h1>
          {(movie?.title ?? movie?.name ?? movie?.original_name) as string}
        </h1>
        <BannerButtonsContainer>
          <BannerButton>Play</BannerButton>
          <BannerButton>My List</BannerButton>
        </BannerButtonsContainer>
        <BannerDescription>
          {truncate(150, movie?.overview as string)}
        </BannerDescription>
      </BannerContent>
      <BannerFade />
    </BannerContainer>
  );
};

const NavBarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 0;
  width: 100%;
  padding: ${Pad.Medium};
  height: 30px;
  z-index: 1;
  transition: background-color 450ms ease-in;

  background-color: ${(props: { scrolled?: boolean }) =>
    props?.scrolled ? '#111' : 'none'};
`;

const NavBarLogo = styled.img.attrs(() => ({
  src:
    'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  alt: 'Netflix Logo',
}))`
  position: fixed;
  left: 20px;
  width: 80px;
  object-fit: contain;
`;

const NavBarAvatar = styled.img.attrs(() => ({
  src: 'https://diggwithme.files.wordpress.com/2012/09/defaut-avatar.png',
  alt: 'Netflix Avatar',
}))`
  position: fixed;
  right: 20px;
  width: 30px;
  object-fit: contain;
`;

const NavBar: FC = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const effect = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', effect);
    return () => window.removeEventListener('scroll', effect);
  }, []);
  return (
    <NavBarContainer scrolled={scrolled}>
      <NavBarLogo />
      <NavBarAvatar />
    </NavBarContainer>
  );
};

const AppContainer = styled.div`
  background-color: #111;
  color: #fff;
`;

export const App: FC = () => (
  <AppContainer>
    <NavBar />
    <Banner />
    <MovieRow
      large
      title="NETFLIX ORIGINALS"
      fetchUrl={requests.fetchNetflixOriginals}
    />
    <MovieRow title="Trending Now" fetchUrl={requests.fetchTrending} />
    <MovieRow title="Top Rated" fetchUrl={requests.fetchTopRated} />
    <MovieRow title="Action Movies" fetchUrl={requests.fetchActionMovies} />
    <MovieRow title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} />
    <MovieRow title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} />
    <MovieRow title="Romance Movies" fetchUrl={requests.fetchRomanceMovies} />
    <MovieRow title="Documentaries" fetchUrl={requests.fetchDocumentaries} />
  </AppContainer>
);

// class AsyncDataError<T extends unknown> extends Error {
//   // TODO Something useful with `data`.
//   constructor(data: T) {
//     super();
//     if (Error.captureStackTrace) Error.captureStackTrace(this, AsyncDataError);
//     this.name = 'AsyncDataError';
//   }
// }

// type AsyncData<T> = 'AsyncData::Loading' | AsyncDataError<unknown> | T;

// const AsyncData = {
//   Loading: 'AsyncData::Loading' as const,
//   isLoading: <T extends unknown>(data: AsyncData<T>) =>
//     data === AsyncData.Loading,
//   error: (error: unknown) => new AsyncDataError(error),
// };

// const useAsyncData = <T extends unknown>(
//   getData: () => Promise<T>,
//   deps: unknown[]
// ): AsyncData<T> => {
//   const [data, setData] = useState<AsyncData<T>>(AsyncData.Loading);

//   useEffect(() => {
//     getData()
//       .then((result) => {
//         setData(result);
//       })
//       .catch((error) => {
//         setData(AsyncData.error(error));
//       });
//   }, deps);

//   return data;
// };

// const AsyncDataView = <T extends unknown>(props: {
//   data: AsyncData<T>;
// }): React.ReactNode => {
//   if (AsyncData.isLoading(props.data)) {
//     return <div>Loading...</div>;
//   }
//   // TODO
//   return <div></div>;
// };
