import React from "react";
import {Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import SignUp from './pages/signup/Signup';
import Header from "./components/common/header/Header";
import Notfound from "./pages/notfound/Notfound";
import Footer from "./components/common/footer/Footer";
import Login from "./pages/login/login"

const App = () => {
  return (
    <>
      <Header/>
      <Routes>
        <Route path="*" element={<Notfound/>} />
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login/>} />
      </Routes>
      <Footer/>
    </>
  )
};

export default App;