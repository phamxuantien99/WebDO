import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

interface Props {
  children: ReactNode;
}

// Interface cho Context
export interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;

  isLoadingData: boolean;
  setIsLoadingData: Dispatch<SetStateAction<boolean>>;

  auth: string;
  setAuth: Dispatch<SetStateAction<string>>;
  setUserInfo: Dispatch<SetStateAction<any>>;
  userInfo: any;

  selectedAnalysis: string;
  setSelectedAnalysis: (value: string) => void;

  searchQuery: string;
  setSearchQuery: (value: string) => void;

  currentPage: number;
  setCurrentPage: (value: number) => void;

  setDataAnalysis: Dispatch<SetStateAction<any>>;
  dataAnalysis: any;

  setDataAnalysisDelivered: Dispatch<SetStateAction<any>>;
  dataAnalysisDelivered: any;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | null>(null);

// Hook tùy chỉnh để sử dụng Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider của Context
export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [auth, setAuth] = useState<string>("");
  const [userInfo, setUserInfo] = useState<any>({});
  const [selectedAnalysis, setSelectedAnalysis] = useState("On Going");
  const [dataAnalysis, setDataAnalysis] = useState<any>({});
  const [dataAnalysisDelivered, setDataAnalysisDelivered] = useState<any>({});

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      setAuth(authToken);
      setIsLoggedIn(true);
    }
  }, [isLoggedIn]);

  const authContextValue: AuthContextType = {
    auth,
    setAuth,
    isLoggedIn,
    setIsLoggedIn,
    setUserInfo,
    userInfo,
    selectedAnalysis,
    setSelectedAnalysis,
    setDataAnalysis,
    dataAnalysis,
    isLoadingData,
    setIsLoadingData,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    setDataAnalysisDelivered,
    dataAnalysisDelivered,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
