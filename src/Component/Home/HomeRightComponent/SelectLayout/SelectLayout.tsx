import { useContext, useEffect, useRef } from "react";
import AuthContext, { AuthContextType } from "../../../context/AuthProvider";
import { api } from "../../../service/api/endpoint";
import { axiosInstanceV2 } from "../../../service/hooks/axiosInstance";
import { useDebounce } from "../../../service/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

const dataSelectOption = ["On Going", "Delivered"];

const SelectLayout = () => {
  const {
    setSelectedAnalysis,
    selectedAnalysis,
    setDataAnalysis,
    setIsLoadingData,
    searchQuery,
    currentPage,
    setSearchQuery,
    auth,
  } = useContext(AuthContext) as AuthContextType;

  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };

  const debouncedSearchValue = useDebounce(searchQuery, 1000);

  const fetchDataLogistic = async (
    currentPage?: number,
    searchValue?: string,
    status?: string
  ) => {
    try {
      const response = await axiosInstanceV2.get(
        api.getDataLogisticAllVoicesV2(currentPage, searchValue, status),
        { headers }
      );
      return response.data;
    } catch (error) {
      return { error: "Failed to fetch data" };
    }
  };

  const { data: dataLogisticOngoing, isLoading: isLoadingOngoing } = useQuery({
    queryKey: [
      "dataLogisticOngoing",
      currentPage,
      debouncedSearchValue,
      "ongoing",
    ],
    queryFn: () =>
      fetchDataLogistic(currentPage, debouncedSearchValue, "ongoing"),
    refetchOnWindowFocus: false,
  });

  const { data: dataLogisticDelivered, isLoading: isLoadingDelivered } =
    useQuery({
      queryKey: [
        "dataLogisticDelivered",
        currentPage,
        debouncedSearchValue,
        "delivery",
      ],
      queryFn: () =>
        fetchDataLogistic(currentPage, debouncedSearchValue, "delivery"),
      refetchOnWindowFocus: false,
    });

  const handleButtonClick = async (value: string) => {
    setSelectedAnalysis(value);
    setDataAnalysis({}); // Xóa dữ liệu cũ trước khi tải dữ liệu mới
    setSearchQuery(""); // Xóa dữ liệu search trước khi tải dữ liệu mới
    // Bắt đầu trạng thái loading
    if (value === "On Going") {
      setIsLoadingData(isLoadingOngoing);
      setDataAnalysis(dataLogisticOngoing);
    } else if (value === "Delivered") {
      setIsLoadingData(isLoadingDelivered);
      setDataAnalysis(dataLogisticDelivered);
    }
  };

  useEffect(() => {
    if (selectedAnalysis === "On Going") {
      setDataAnalysis(dataLogisticOngoing);
      setIsLoadingData(isLoadingOngoing);
    } else {
      setIsLoadingData(isLoadingDelivered);
      setDataAnalysis(dataLogisticDelivered);
    }
  }, [
    isLoadingOngoing,
    isLoadingDelivered,
    dataLogisticOngoing,
    dataLogisticDelivered,
    selectedAnalysis,
  ]);

  // Gọi API Ongoing mặc định khi vào trang

  return (
    <div className="flex flex-col gap-4">
      {/* Hiển thị các nút */}
      <div className="flex flex-wrap gap-2">
        {dataSelectOption.map((item, index) => (
          <button
            key={index}
            onClick={() => handleButtonClick(item)}
            className={`btn w-auto text-[15px] capitalize px-10 ${
              selectedAnalysis === item
                ? "bg-[#22ABE0] border-[#22ABE0] hover:bg-[#22ABE0] hover:border-[#22ABE0] text-white"
                : "bg-[#27B770] border-[#27B770] hover:bg-[#22ABE0] hover:border-[#22ABE0]"
            }`}
          >
            {item.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectLayout;
