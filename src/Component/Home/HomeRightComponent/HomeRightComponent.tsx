import React from "react";
import SelectLayout from "./SelectLayout/SelectLayout";
import LogoutBtn from "../Logout/LogoutBtn";
import ContentRight from "./ContentRight/ContentRight";

function HomeRightComponent() {
  return (
    <div className="mx-[auto] w-full">
      <div className="flex mb-5 justify-between items-center">
        <SelectLayout />
        <LogoutBtn />
      </div>

      <ContentRight />
    </div>
  );
}

export default HomeRightComponent;
