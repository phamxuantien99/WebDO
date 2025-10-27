import React, { useContext, useEffect, useRef, useState } from "react";
import { BsFillEyeFill, BsFillEyeSlashFill } from "react-icons/bs";
import AuthContext, { AuthContextType } from "../context/AuthProvider";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api } from "../service/api/endpoint";
import logo1 from "../../assets/images/logo1.png";
import { axiosInstance } from "../service/hooks/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserInfo, isLoggedIn } = useContext(
    AuthContext
  ) as AuthContextType;

  const loginFormRef = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home");
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    axiosInstance
      .post(api.getLogin, {
        user_name: username,
        password: password,
      })
      .then((res) => {
        const accessToken = res.data.access_token;
        localStorage.setItem("authToken", accessToken);
        localStorage.setItem("refreshToken", res.data.refresh_token);
        setUserInfo(res.data.user_info);
        localStorage.setItem(
          "authUser",
          JSON.stringify(res.data.user_info.is_superuser)
        );
        setIsLoggedIn(true);
        navigate("/home");
      })
      .catch((e) => {
        setIsLoggedIn(false);
        switch (e.response.status) {
          case 401:
            alert("Unauthorized");
            break;
          default:
            alert("Something went wrong, please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="h-screen w-screen left-0 top-0 flex justify-center items-center">
      <div>
        <form ref={loginFormRef} onSubmit={(e) => handleLogin(e)}>
          <div className="flex flex-col gap-3">
            <img className="w-[300px]" src={logo1} alt="logo" />
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                placeholder="Username"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="input input-bordered w-full"
                />
                <div
                  className="btn btn-square"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <BsFillEyeFill /> : <BsFillEyeSlashFill />}
                </div>
              </div>
            </div>
            <div>
              <button
                disabled={loading || !!!username || !!!password}
                type="submit"
                className={`btn btn-primary ${loading && "loading"}`}
              >
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
