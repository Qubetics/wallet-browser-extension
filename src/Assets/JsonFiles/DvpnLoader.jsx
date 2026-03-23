import React from "react";
import Lottie from "react-lottie-player";
import loaderAnimation from "./loaderFile.json";

export default function DvpnLoader() {
  return <Lottie animationData={loaderAnimation} loop play />;
}
