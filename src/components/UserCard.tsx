import type { ReactElement } from "react";

export default function UserCard({user}: {user: {name: string, profileImg: string}}): ReactElement {
  return (
    <div>
      <h2>{user.name}</h2>
      <img src={user.profileImg} alt="user profile" />
    </div>
  );
}