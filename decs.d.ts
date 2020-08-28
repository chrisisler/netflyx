declare module 'movie-trailer' {
  function movieTrailer(movie: string): Promise<string>;
  export default movieTrailer;
}
