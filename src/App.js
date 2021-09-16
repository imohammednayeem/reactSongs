import React, { useState, useEffect, Suspense } from "react";
import "./App.css";
import { login, logout, selectUser } from "./features/userSlice";
import Info from "./Info";
import Home from "./Home";
import Header from "./Header";
import Login from "./Login";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "./firebase";
import Widgets from "./Widgets";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";
import api from "./api/songs";
import { v4 as uuidv4 } from "uuid";
import AddSong from "./AddSong";
import EditSong from "./EditSong";
import SongDetail from "./SongDetail";
import Trend from "./Trend";
import Sidebar from "./Sidebar";

const SongList = React.lazy(() => import("./SongList"));

function App() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [view, setView] = useState(true);

  const retrieveSongs = async () => {
    const response = await api.get("/songs");
    setSongs(response.data);
    return response.data;
  };

  const addSongHandler = async (song) => {
    const request = {
      id: uuidv4(),
      ...song,
      count: 1,
    };

    const response = await api.post("/songs", request);
    setSongs([...songs, response.data]);
  };

  const updateSongHandler = async (song) => {
    const response = await api.put(`/songs/${song.id}`, song);
    const { id } = response.data;

    setSongs(
      songs.map((song) => {
        return song.id === id ? { ...response.data } : song;
      })
    );
  };

  const removeSongHandler = async (id) => {
    await api.delete(`/songs/${id}`);
    const newSongList = songs.filter((song) => {
      return song.id !== id;
    });

    setSongs(newSongList);
  };

  const searchHandler = (searchTerm) => {
    setSearchTerm(searchTerm);
    if (searchTerm !== "") {
      const newSongList = songs.filter((contact) => {
        return Object.values(contact)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
      setSearchResults(newSongList);
    } else {
      setSearchResults(songs);
    }
  };

  useEffect(() => {
    const getAllSongs = async () => {
      const allSongs = await retrieveSongs();
      if (allSongs) setSongs(allSongs);
    };

    getAllSongs();
  }, []);

  // useEffect(() => {}, [songs]);

  useEffect(() => {
    auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        dispatch(
          login({
            email: userAuth.email,
            uid: userAuth.uid,
            displayName: userAuth.displayName,
            photoUrl: userAuth.photoURL,
          })
        );
      } else {
        dispatch(logout());
      }
    });
  }, [dispatch]);

  const showView = () => {
    if (window.innerWidth <= 960) {
      setView(false);
    } else {
      setView(true);
    }
  };

  useEffect(() => {
    showView();
    window.addEventListener("resize", showView);
  }, []);

  return (
    <>
      <Router>
        {!user ? (
          <div className="app">
            <Login />
          </div>
        ) : (
          <div className="app">
            <Header />
            <div className="app__body">
              {view ? <Sidebar /> : null}
              <Suspense
                fallback={
                  <div className="home">
                    <div className="home__inputContainer">
                      <img
                        src="https://cdn.dribbble.com/users/189524/screenshots/1887541/foxfunwalk-800x600_v2.gif"
                        alt="Loading..."
                      />
                    </div>
                  </div>
                }
              >
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route exact path="/info" component={Info} />
                  <Route
                    exact
                    path="/trend"
                    render={() => <Trend songs={songs} />}
                  />
                  <Route
                    path="/list"
                    exact
                    render={(props) => (
                      <SongList
                        {...props}
                        songs={searchTerm.length < 1 ? songs : searchResults}
                        getSongId={removeSongHandler}
                        term={searchTerm}
                        searchKeyword={searchHandler}
                        updateSongHandler={updateSongHandler}
                        retrieveSongs={retrieveSongs}
                      />
                    )}
                  />
                  <Route
                    path="/edit"
                    exact
                    render={(props) => (
                      <EditSong
                        {...props}
                        updateSongHandler={updateSongHandler}
                      />
                    )}
                  />
                  <Route path="/song/:id" component={SongDetail} />
                  <Route
                    path="/add"
                    render={(props) => (
                      <AddSong {...props} addSongHandler={addSongHandler} />
                    )}
                  />
                  <Route path="*" component={NotFoundPage} />
                </Switch>
              </Suspense>
              {view ? <Widgets /> : null}
            </div>
          </div>
        )}
      </Router>
    </>
  );
}

export default App;