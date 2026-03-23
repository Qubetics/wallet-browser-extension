import { ClipLoader } from "react-spinners";
import "./style.scss";

export function Loader({ text }) {
  return (
    <div className='loader-main'>
      <ClipLoader size={45} color='#00adee' />

      <p
        style={{
          marginTop: "10px",
        }}
      >
        {text}
      </p>
    </div>
  );
}
