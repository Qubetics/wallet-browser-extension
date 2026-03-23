import React from "react";
import DefiList from "../../Components/DefiComponent/DefiList";
import DefiHeading from "../../Components/DefiComponent/DefiHeading.jsx";
import style from "./style.module.scss"
import Userimg from "../../Assets/PNG/userimg.png"
import Usersicons from "../../Assets/PNG/usersicons.png";
function Defi() {
  const data = [
    {
      tickIcon: Userimg,
      stakingHead: "Pancake farming",
      desc: "It is a long established fact that a reader.....",
    },
    {
      tickIcon:Usersicons,
      stakingHead: "Aava Staking",
      desc: "It is a long established fact that a reader.....",
    },
    {
      tickIcon:Userimg,
      stakingHead: "Lido Staking",
      desc: "It is a long established fact that a reader.....",
    },
  ];
  const user2 = [
    {
      tickIcon:Usersicons,
      stakingHead: "Pancake farming",
      desc: "It is a long established fact that a reader.....",
    },
    {
      tickIcon:Userimg,
      stakingHead: "Aava Staking",
      desc: "It is a long established fact that a reader.....",
    },
    {
      tickIcon:Usersicons,
      stakingHead: "Lido Staking",
      desc: "It is a long established fact that a reader.....",
    },
  ];
  const user3 = [
    {
      tickIcon:Userimg,
      stakingHead: "Pancake farming",
      desc: "It is a long established fact that a reader.....",
    },
    {
      tickIcon:Usersicons,
      stakingHead: "Aava Staking",
      desc: "It is a long established fact that a readerfact that a reader.....",
    },
    {
      tickIcon:Userimg,
      stakingHead: "Lido Staking",
      desc: "It is a long established fact that a reader.....",
    },
  ];

  return (
    <div className="">
      <div className={style.bordered}>
        <DefiHeading header="Staking Section" />
        {data.map((user) => (
          <DefiList desc={user.desc} stakingHead={user.stakingHead} tickIcon={user.tickIcon} />
        ))}
      </div>
      <div className={style.bordered}>
        <DefiHeading header="Yield farming" />
        {data.map((user2) => (
          <DefiList desc={user2.desc} stakingHead={user2.stakingHead} tickIcon={user2.tickIcon} />
        ))}
      </div>
      <div className={style.bordered}>
        <DefiHeading header="History" />
        {data.map((user3) => (
          <DefiList desc={user3.desc} stakingHead={user3.stakingHead} tickIcon={user3.tickIcon} />
        ))}
      </div>
    </div>
  );
}

export default Defi;
