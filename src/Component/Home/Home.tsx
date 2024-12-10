import "react-datepicker/dist/react-datepicker.css";
import HomeLeftComponent from "./HomeLeftComponent/HomeLeftComponent";
import HomeRightComponent from "./HomeRightComponent/HomeRightComponent";

const Home = () => {
  return (
    <div className="bg-[#0d75be] min-h-screen">
      <div className="grid xl:grid-cols-4">
        <div className="xl:col-span-1 p-5 flex items-center justify-center glass min-h-screen">
          <HomeLeftComponent />
        </div>
        <div className="xl:col-span-3 max-h-[100vh] overflow-y-auto p-5">
          <div>
            <HomeRightComponent />
          </div>
        </div>
      </div>

      {/* {errorMsg && <>{renderErrorMsg()}</>} */}
    </div>
  );
};

export default Home;
