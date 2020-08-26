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
  fetchDocumentaries: `/discover/movie?api_key=${process.env.REACT_APP_TMDB_API_KEY}&with_genres=99`
};

/**
 * Get a resource. If not from storage, then it is fetched and cached.
 * Provides basic error logging.
 */
const get = <T extends unknown>(url: string): Promise<T> =>
  preferStorage(url, () =>
    fetch(`https://api.themoviedb.org/3${url}`)
      .then(response => {
        if (!response.ok) throw Error(`Response not okay: ${response}`);
        return response.json();
      })
      .catch(error => {
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
  XLarge = '3rem'
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

const ContentRow: FC<{
  title: string;
  fetchUrl: string;
  large?: boolean;
}> = ({ title, fetchUrl, large }) => {
  const [movies, setMovies] = useState<ApiItem[]>([]);

  // Fetch and display the content for the given url
  useEffect(() => {
    let subscribed = true;
    get<{ results: ApiItem[] }>(fetchUrl)
      .then(response => {
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
        {movies.map(movie => (
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

export const App = () => {
  return (
    <main>
      <h3>Netflyx</h3>
      <ContentRow
        large
        title="NETFLIX ORIGINALS"
        fetchUrl={requests.fetchNetflixOriginals}
      />
      <ContentRow title="Trending Now" fetchUrl={requests.fetchTrending} />
      <ContentRow title="Top Rated" fetchUrl={requests.fetchTopRated} />
      <ContentRow title="Action Movies" fetchUrl={requests.fetchActionMovies} />
      <ContentRow title="Comedy Movies" fetchUrl={requests.fetchComedyMovies} />
      <ContentRow title="Horror Movies" fetchUrl={requests.fetchHorrorMovies} />
      <ContentRow
        title="Romance Movies"
        fetchUrl={requests.fetchRomanceMovies}
      />
      <ContentRow
        title="Documentaries"
        fetchUrl={requests.fetchDocumentaries}
      />
    </main>
  );
};
