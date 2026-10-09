import React from "react";
import Logo from "../../Assets/logo.png";
import ButtonComp from "../ButtonComp/ButtonComp";

// Shows a recoverable error screen instead of a blank popup when a screen crashes
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mainTanceSec">
        <img src={Logo} alt="" />
        <h3>Something went wrong</h3>
        <p>Please reload the wallet and try again.</p>
        <ButtonComp
          text={"Reload"}
          maxWidth={"100%"}
          marginTop={"100px"}
          onClick={() => window.location.reload()}
        />
      </div>
    );
  }
}
