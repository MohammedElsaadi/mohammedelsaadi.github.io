import {Link} from "react-router-dom";

function Games () {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h3>Games Page</h3>
        <Link
              to="/"
              className="px-5 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Home
        </Link>
        <Link
              to="splendid-rivalry"
              className="px-5 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Splendid Rivalry
        </Link>
    </div>
  );
}

export default Games;