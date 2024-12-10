import axios from "axios";
import { useContext } from "react";
import AuthContext, { AuthContextType } from "../../context/AuthProvider";
import { BASE_URL } from "../api/BaseUrl";

export const getRefreshToken = () => localStorage.getItem("refreshToken");

const UseRefreshToken = () => {
  const { setAuth } = useContext(AuthContext) as AuthContextType;

  const refresh = async () => {
    const reponse = await axios.put(`${BASE_URL}/auth/refresh`, {
      refresh_token: getRefreshToken(),
    });
    localStorage.setItem("authToken", reponse.data[0]);
    // setAuth((prev: any) => {
    //   return { ...prev, authToken: reponse.data[0] };
    // });

    // console.log({ first: reponse.data[0] });
    setAuth(reponse.data[0]);
    return reponse.data[0];
  };

  return refresh;
};

export default UseRefreshToken;
