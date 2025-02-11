import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CSSProperties, useContext, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { FadeLoader } from "react-spinners";
import AuthContext, { AuthContextType } from "../../context/AuthProvider";
import { api } from "../../service/api/endpoint";
import UseRefreshToken from "../../service/hooks/useRefreshToken";
import logo1 from "../../../assets/images/logo1.png";
import {
  axiosInstance,
  axiosInstanceV2,
} from "../../service/hooks/axiosInstance";

const override: CSSProperties = {
  display: "flex",
  // margin: "500px auto",
  borderColor: "red",
  fontSize: "50px",
};

interface FoundItem {
  year: string;
  projects: any[];
}

interface InputData {
  serial_no: string;
  additional_component: string;
}

interface InputErrors {
  [key: string]: boolean;
}

const ListModeOfDelivery = [
  { value: "Self Collection", label: "Self Collection" },
  { value: "Delta Tech", label: "Site Delivery" },
];

const HomeLeftComponent = () => {
  const navigation = useNavigate();
  const generateInvoiceFormRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filteredDate, setFilteredDate] = useState<string>("");
  const [listYear, setListYear] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [listProjectCode, setListProjectCode] = useState<string[]>([]);
  const [selectedProjectCode, setSeletedProjectCode] = useState<string>("");
  const [listSerialNumber, setListSerialNumber] = useState<string[]>([]);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<any>([]);
  const [additionalComponents, setAdditionalComponents] = useState<any>([]);

  const [modeOfDelivery, setSetModeOfDelivery] = useState<string>("");

  const [contactPerson, setContactPerson] = useState<string>("");
  const [yourRef, setYourRef] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<any>([]);

  const { auth } = useContext(AuthContext) as AuthContextType;
  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };

  const getSelectedSerialNumber = (event: any) => {
    const { value, checked } = event.target;

    // Case 1 : The user checks the box
    if (checked) {
      setSelectedSerialNumber([...selectedSerialNumber, value]);
    }
    // Case 2  : The user unchecks the box
    else {
      setSelectedComponent(
        selectedComponent.filter((item: any) => item.serial_no !== value)
      );
      setSelectedSerialNumber(
        selectedSerialNumber.filter((item: any) => item !== value)
      );
      setAdditionalComponents(
        additionalComponents.filter((item: any) => item.serial_no !== value)
      );
    }
  };

  const fetchDataLogistic = async () => {
    try {
      return await axiosInstance
        .get(api.getLogisticSerialNumber, { headers })
        .then((res) => res.data);
    } catch (error) {
      UseRefreshToken();
      return { error: "Failed to fetch data" };
    }
  };

  const { data: dataTotalProduct, isLoading: isLoadingTotalProduct } = useQuery(
    {
      queryKey: ["dataTotalProduct"],
      queryFn: () => fetchDataLogistic(),
      refetchOnWindowFocus: false,
      enabled: !!auth,
    }
  );

  const fetchDataComponents = async (
    project_code: string,
    year: string,
    signal: AbortSignal
  ) => {
    const controller = new AbortController();
    signal.addEventListener("abort", () => controller.abort());

    try {
      return await axiosInstance
        .get(api.getLogisticComponentByProjectCode(project_code, year), {
          signal: controller.signal,
          headers,
        })
        .then((res) => res.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled", error.message);
      } else {
        UseRefreshToken();

        return { error: "Failed to fetch data" };
      }
    }
  };

  const { data: dataComponents, isLoading: isLoadingComponents } = useQuery({
    queryKey: ["dataComponents", selectedProjectCode, selectedYear],
    queryFn: ({ signal }) =>
      fetchDataComponents(selectedProjectCode, selectedYear, signal),
    refetchOnWindowFocus: false,
    enabled: !!selectedProjectCode && !!selectedYear,
  });

  // Set Select year
  useEffect(() => {
    if (dataTotalProduct) {
      const years = dataTotalProduct?.founds
        .map((item: any) => item.year)
        .filter(
          (item: any, i: any, ar: string | any[]) => ar.indexOf(item) === i
        );

      setListYear(years);
      setSelectedComponent([]);
    }
  }, [dataTotalProduct]);

  // Set Select project code
  useEffect(() => {
    if (dataTotalProduct?.founds) {
      const projects = dataTotalProduct?.founds
        .filter((item: any) => item["year"] === selectedYear)
        .map((item: any) => item["projects"].map((a: any) => a["project_code"]))
        .flat();

      projects.sort((a: string, b: string) => {
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
      });

      setListProjectCode(projects);
    }
    setListSerialNumber([]);
    setSeletedProjectCode("");
    setSelectedSerialNumber([]);
    setAdditionalComponents([]);
    setSelectedComponent([]);

    // retetchComponents();
  }, [selectedYear]);

  useEffect(() => {
    if (!dataComponents) return;
    const serialNumbers = dataComponents?.founds?.map(
      (item: any) => item["serial_no"]
    );
    setListSerialNumber(serialNumbers);
    setAdditionalComponents([]);
    setSelectedSerialNumber([]);
  }, [dataComponents, isLoadingComponents]);

  // get selected component
  const getSelectedComponent = (event: any, serial: any) => {
    const { value, checked } = event.target;

    // Case 1 : The user checks the box
    if (checked) {
      const valComp = [
        ...selectedComponent,
        { serial_no: serial, components: [value] },
      ];
      const payload = valComp.filter((item, index) => {
        return valComp.indexOf(item) === index;
      });
      setSelectedComponent(payload);
    }

    // Case 2  : The user unchecks the box
    else {
      const payload = selectedComponent
        .map((item: any) => {
          let components = item.components;
          if (item.serial_no === serial) {
            components = item.components.filter((item: any) => item !== value);
          }

          return {
            ...item,
            components,
          };
        })
        .filter((item: any) => {
          return item.components.length > 0;
        });
      setSelectedComponent(payload);
    }
  };

  const _filterDate = (date: Date | null) => {
    setSelectedDate(date);
    setFilteredDate(
      date?.getFullYear() +
        "-" +
        ((date?.getMonth() as number) + 1) +
        "-" +
        date?.getDate()
    );
  };

  const [errors, setErrors] = useState<InputErrors>({});

  // select component options other
  const getSelectedComponents = (e: any, serial: any) => {
    const { checked } = e.target;
    // setIsCheckedAdditional(checked);
    if (checked) {
      // setIsCheckedAdditional(checked);
      const valComp = [
        ...additionalComponents,
        { serial_no: serial, additional_component: "" },
      ];
      const payload = valComp.filter((item, index) => {
        return valComp.indexOf(item) === index;
      });
      setAdditionalComponents(payload);
    }

    // Case 2  : The user unchecks the box
    else {
      // setIsCheckedAdditional(checked);
      const payload = additionalComponents.filter((item: any) => {
        return item.serial_no !== serial;
      });

      setAdditionalComponents(payload);
    }
  };

  const getAdditionalComponents = (e: any, serial: any) => {
    const objIndex = additionalComponents.findIndex(
      (obj: any) => obj.serial_no === serial
    );
    let newArray = [...additionalComponents];
    if (e.target.value !== "") {
      newArray[objIndex].additional_component = e.target.value;
    } else {
      newArray[objIndex].additional_component = "";
    }
    setAdditionalComponents(newArray);
  };

  const validateOptionsSerial = () => {
    const newErrors: InputErrors = {};
    let hasError = false;
    additionalComponents.forEach((additionalComponent: any) => {
      const { serial_no, additional_component } = additionalComponent;
      const selected = dataComponents?.founds
        .filter((sc: any) => sc.serial_no === serial_no)
        .map((item: any) => item.available_components)
        .flat()
        .includes(additional_component);
      if (!additional_component || selected) {
        newErrors[serial_no] = true;
        hasError = true;
      } else {
        newErrors[serial_no] = false;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const mergedData = Object.values(
    selectedComponent.reduce((acc: any, currentValue: any) => {
      if (!acc[currentValue.serial_no]) {
        // Nếu serial_no chưa tồn tại trong accumulator, khởi tạo một đối tượng mới
        acc[currentValue.serial_no] = {
          serial_no: currentValue.serial_no,
          components: [], // Khởi tạo mảng components
        };
      }

      // Thêm components từ currentValue vào mảng components của accumulator
      if (currentValue.components) {
        acc[currentValue.serial_no].components.push(...currentValue.components);
      }

      return acc;
    }, {})
  );

  const [generating, setGenerating] = useState<boolean>(false);

  const _handleGenerateInvoice = (event: any) => {
    event.preventDefault();

    if (generating) return;
    setGenerating(true);

    const payload = {
      selected_serials: selectedSerialNumber,
      selected_components: mergedData,
      additional_components: additionalComponents,
    };

    if (validateOptionsSerial()) {
      // Submit form nếu không có lỗi

      axiosInstanceV2
        .post(
          api.postGenInvoiceV21(
            Number(selectedYear),
            selectedProjectCode,
            contactPerson,
            contactNumber,
            modeOfDelivery,
            yourRef,
            remark,
            filteredDate
          ),
          payload,
          { headers }
        )
        .then((res: any) => {
          console.log("data", res.data);
          navigation("/home/invoice", { state: res.data });
        })
        // .then((res: any) => {
        //   console.log("data", res);
        // })
        .catch((e) => {
          if ((e.response.status = 409)) {
            alert(e.response.data.detail);
          } else if ((e.response.status = 500)) {
            console.log("internal server error");
          } else {
            alert(
              "Something went wrong, please try again => HomeLeft Component"
            );
          }
        })
        .finally(() => setGenerating(false));
    } else {
      setGenerating(false);
    }
  };

  return (
    <form
      ref={generateInvoiceFormRef}
      className="flex flex-col gap-5 mb-7 p-7 border-2 rounded-2xl shadow-2xl w-full md:min-w-[400px] bg-white"
      onSubmit={(event) => _handleGenerateInvoice(event)}
    >
      <div className="flex justify-between items-center">
        <img className="w-[500px]" src={logo1} alt="logo" />
      </div>
      <div className="grid gap-5">
        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Generate Date
            </label>
            <DatePicker
              className="input input-bordered w-full"
              selected={selectedDate}
              onChange={(date) => _filterDate(date)}
              placeholderText="dd/mm/yyyy"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Year
            </label>
            <select
              name="selectedYeaer"
              value={selectedYear}
              required
              onChange={(event) => setSelectedYear(event.target.value)}
              className="select select-bordered w-full"
            >
              <option disabled value="">
                Please select a Year
              </option>
              {listYear.map((item, index) => (
                <option value={`${item}`} key={index}>{`${item}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Project code
            </label>
            <Select
              className="basic-single"
              classNamePrefix="select"
              placeholder="Select or Search Project code"
              defaultValue={listProjectCode
                .map((item) => ({ value: item, label: item }))
                .at(1)}
              isDisabled={false}
              isClearable={false}
              isSearchable={true}
              name="projectCode"
              onChange={(event) => setSeletedProjectCode(event!.value)}
              options={listProjectCode.map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </div>
          <div>
            {isLoadingComponents ? (
              <FadeLoader
                loading={isLoadingComponents}
                cssOverride={override}
                color="red"
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            ) : (
              <div>
                <fieldset>
                  <legend className="block text-gray-700 text-sm font-bold mb-2">
                    Serial Number
                  </legend>
                  <div>
                    <div className="flex flex-wrap gap-3">
                      {listSerialNumber?.map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox"
                            name="serial"
                            value={item}
                            onChange={(event) => getSelectedSerialNumber(event)}
                          />
                          <span className="label-text">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </fieldset>
              </div>
            )}
          </div>

          <div>
            {selectedSerialNumber.map(
              (serial: string | number, index: string) => (
                <fieldset key={index}>
                  <legend className="block text-gray-700 text-sm font-bold mb-2">
                    Components - {serial}
                  </legend>
                  <div>
                    <div className="flex flex-wrap gap-3">
                      {dataComponents?.founds
                        ?.find((item: any) => item.serial_no === serial)
                        ?.available_components?.map(
                          (component: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-3"
                            >
                              <input
                                type="checkbox"
                                className="checkbox"
                                id={serial.toString() + component}
                                name={serial.toString()}
                                value={component}
                                onChange={(event) =>
                                  getSelectedComponent(event, serial)
                                }
                              />
                              <span className="label-text">{component}</span>
                            </div>
                          )
                        )}
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          onChange={(event) =>
                            getSelectedComponents(event, serial)
                          }
                        />
                        <span className="label-text ">Other option</span>
                      </div>
                      {additionalComponents?.some(
                        (item: any) => item.serial_no === serial
                      ) ? (
                        <div>
                          <input
                            type="text"
                            id="optionInput"
                            className="input input-bordered w-full"
                            onChange={(event) =>
                              getAdditionalComponents(event, serial)
                            }
                          />
                          {errors[serial] && (
                            <p className="text-red-600 mt-1 text-sm">
                              The value cannot the same or empty
                            </p>
                          )}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </fieldset>
              )
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Contact Person
            </label>
            <input
              required
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              type="text"
              placeholder="Contact person"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Contact Number
            </label>
            <input
              required
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              type="text"
              placeholder="Contact number"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mode of Delivery
            </label>
            <select
              name="selectedYeaer"
              value={modeOfDelivery}
              required
              onChange={(event) => setSetModeOfDelivery(event.target.value)}
              className="select select-bordered w-full"
            >
              <option disabled value="">
                Please select a Mode of Delivery
              </option>
              {ListModeOfDelivery.map((item, index) => (
                <option
                  value={`${item.value}`}
                  key={index}
                >{`${item.label}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Client Ref
            </label>
            <input
              value={yourRef}
              onChange={(event) => setYourRef(event.target.value)}
              type="text"
              placeholder="Client Ref"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Remark
            </label>
            <input
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              type="text"
              placeholder="Remark"
              className="input input-bordered w-full"
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className={`btn btn - primary ${generating && "loading"}`}
        // disabled={isValidateInput}
      >
        Generate Delivery Order
      </button>
    </form>
  );
};

export default HomeLeftComponent;
