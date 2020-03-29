 // src/components/contacts.js

    import React from 'react'

    const Movies = ({movies}) => {
      return (
        <div>
          <center><h1>Here is a random movie with Denzel Washington ! </h1></center>
          {movies.map((movie) => (
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{movie.title} </h5>
                                  <img src={movie.poster} ></img>

                <h6 class='score'>Metascore : {movie.metascore}</h6>
                <h6 class='score'>Average Rating : {movie.rating} on {movie.votes} votes.</h6>
                <a href={movie.link} target="_blank">{movie.link}</a>
                <p class="card-text">{movie.synopsis}</p>
              </div>
            </div>
          ))}
        </div>
      )
    };

    export default Movies