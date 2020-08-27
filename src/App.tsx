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

/**
 * Used to represent individual objects (like Movie) coming from the API.
 */
type ApiItem = Record<string, unknown>;

const MoviesRow: FC<{
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
    <div>
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
    </div>
  );
};

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
  height: 450px;
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

const BannerButtonsContainer = styled.div``;

const BannerButton = styled.button``;

const BannerDescription = styled.p`
  width: 45rem;
  line-height: 1.3;
  padding-top: ${Pad.Medium};
  font-size: 0.8rem;
  max-width: 360px;
  height: 80px;
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
        <BannerDescription>{movie?.overview as string}</BannerDescription>
      </BannerContent>
    </BannerContainer>
  );
};

export const App: FC = () => {
  return (
    <main>
      <h3>Netflyx</h3>
      <Banner />
      <MoviesRow
        large
        title="NETFLIX ORIGINALS"
        fetchUrl={requests.fetchNetflixOriginals}
      />
      <MoviesRow title="Trending Now" fetchUrl={requests.fetchTrending} />
      <MoviesRow title="Top Rated" fetchUrl={requests.fetchTopRated} />
      <MoviesRow title="Action Movies" fetchUrl={requests.fetchActionMovies} />
      <MoviesRow title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} />
      <MoviesRow title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} />
      <MoviesRow
        title="Romance Movies"
        fetchUrl={requests.fetchRomanceMovies}
      />
      <MoviesRow title="Documentaries" fetchUrl={requests.fetchDocumentaries} />
    </main>
  );
};

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
