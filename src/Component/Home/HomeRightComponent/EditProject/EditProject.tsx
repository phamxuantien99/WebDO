import React, {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { axiosInstanceV2 } from "../../../service/hooks/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../service/api/endpoint";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import AuthContext, { AuthContextType } from "../../../context/AuthProvider";

const ListModeOfDelivery = [
  { value: "Self Collection", label: "Self Collection" },
  { value: "Delta Tech", label: "Site Delivery" },
];

const overrideSerial: CSSProperties = {
  display: "flex",
  // margin: "500px auto",
  borderColor: "red",
  fontSize: "50px",
};

interface InputErrors {
  [key: string]: boolean;
}

const EditProject = () => {
  const { auth } = useContext(AuthContext) as AuthContextType;
  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };
  const { id } = useParams();
  const numbericId = Number(id);
  const location = useLocation();
  const dataDetail = location.state;
  const [updating, setUpdating] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  console.log({ dataDetail });
  const [errors, setErrors] = useState<InputErrors>({});
  const updateInvoiceFormRef = useRef(null);

  const [editDate, setEditDate] = useState<any>(new Date());
  const [updateDate, setUpdateDate] = useState<any>("");

  const [listSerialNumber, setListSerialNumber] = useState<string[]>([]);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<any>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>([]);
  const [additionalComponents, setAdditionalComponents] = useState<any>([]);

  const [edit, setEdit] = useState<any>({
    contact_person: "",
    contact_number: "",
    client_ref: "",
    driver_mode: "",
    remark: "",
    fab_year: "",
    project_code: "",
    invoice_id: 0,
  });
  const defaultEdit = {
    contact_person: "",
    contact_number: "",
    client_ref: "",
    driver_mode: "",
    remark: "",
    fab_year: "",
    project_code: "",
    invoice_id: 0,
  };

  console.log({ id });

  const fetchFabYearById = async (invoice_id: number) => {
    try {
      const response = await axiosInstanceV2.get(
        api.getFabYearById(invoice_id),
        {
          headers,
        }
      );

      return response.data;
    } catch (error) {
      alert("Failed to fetch data Fab Year");
    }
  };

  const { data: dataFabYear, isLoading: isLoadingFabYear } = useQuery({
    queryKey: ["dataFabYear", numbericId],
    queryFn: () => fetchFabYearById(numbericId as any),
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!numbericId, // API chỉ được gọi khi edit.fab_year không phải là chuỗi rỗng
  });

  useEffect(() => {
    const dateSplit = dataDetail["created_at"].split("/");
    const date = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
    setUpdateDate(date);
    setEditDate(new Date(date));
    // setIdInvoice(dataDetail["invoice_id"]);
    const payload = {
      contact_person: dataDetail["contact_person"],
      contact_number: dataDetail["contact_number"],
      client_ref: dataDetail["client_ref"],
      driver_mode: dataDetail["driver"],
      remark: dataDetail["remark"],
      project_code: dataDetail["project_code"],
      invoice_id: dataDetail["invoice_id"],
      fab_year: dataFabYear?.fab_year,
    };
    setSelectedSerialNumber([]);
    setListSerialNumber([]);
    setSelectedComponent([]);
    setAdditionalComponents([]);
    setEdit(Object.assign({}, payload));
  }, [dataDetail, dataFabYear]);

  // call api get component by project code
  const fetchDataLogisticComponent = async (
    invoice_id: number,
    project_code: string,
    year: string
  ) => {
    if (!year) {
      return { error: "Year is empty" }; // Trả về lỗi nếu year rỗng
    }

    try {
      const response = await axiosInstanceV2.get(
        api.getComponentByProjectCodeV2(invoice_id, project_code, year)
        // {
        //   headers,
        // }
      );
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        alert("Please check the Year field again, the year is not correct");
      }
      // Có thể thêm logic sử dụng refresh token ở đây
      return { error: "Failed to fetch data" };
    }
  };

  const { data: dataTotalProduct, isLoading: isLoadingComponent } = useQuery({
    queryKey: [
      "dataComponentV2",
      numbericId,
      edit?.project_code,
      edit?.fab_year,
    ],
    queryFn: () =>
      fetchDataLogisticComponent(numbericId, edit.project_code, edit.fab_year),
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: !!edit?.fab_year && !!numbericId && !!edit?.project_code, // Chỉ gọi API khi fab_year đã có
  });

  useEffect(() => {
    if (!dataTotalProduct) return;
    const serialNumbers = dataTotalProduct?.founds?.map(
      (item: any) => item["serial_no"]
    );
    setListSerialNumber(serialNumbers);
  }, [isLoadingComponent, dataTotalProduct]);

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

  // call api for product detail
  const fetchDataDetail = async (id: number) => {
    try {
      return await axiosInstanceV2
        .get(api.getDataDetailLogisticV2(id))
        .then((res) => res.data);
    } catch (error) {
      return { error: "Failed to fetch data" };
    }
  };

  const { data: dataProductDetail, isLoading: isLoadingProductDetail } =
    useQuery({
      queryKey: ["dataDetailProduct", numbericId],
      queryFn: () => fetchDataDetail(numbericId as any),
      enabled: !!numbericId,
    });

  const filteredData = useMemo(() => {
    if (!dataProductDetail) return [];

    return dataProductDetail?.data?.filter(
      (item: any) => item.delivery_no === dataProductDetail.delivery_order_ref
    );
  }, [dataProductDetail, isLoadingProductDetail]);

  useEffect(() => {
    if (filteredData?.length > 0) {
      console.log("1");
      const serialNumbers = filteredData.map((item: any) => item.serial_no);

      // Xóa duplicate nếu cần và cập nhật state
      const uniqueSerialNumbers = Array.from(new Set(serialNumbers));
      setSelectedSerialNumber(uniqueSerialNumbers);
    }
  }, [filteredData]);

  // lấy components từ data trả về để fill vào giá trị cho việc hiển thị checkbox
  useEffect(() => {
    const resultMain: any = [];
    const resultOtherOption: any = [];

    filteredData?.forEach((item: any) => {
      item?.sub_components?.forEach((component: string) => {
        // Kiểm tra nếu component là một trong các giá trị cần xử lý
        if (
          [
            "Shutterhood",
            "Barrel",
            "Slat",
            "Bottom Bar",
            "Side Guide",
            "Cover",
            "Motor",
            "Accessories",
            "Key No",
          ].includes(component)
        ) {
          // Nếu có, thực hiện logic thêm vào result
          resultMain.push({
            serial_no: item.serial_no,
            components: [component],
          });
        } else {
          // Nếu không, lưu vào otherResult
          resultOtherOption.push({
            serial_no: item.serial_no,
            additional_component: component,
          });
        }
      });
    });

    // Sau khi hoàn thành việc xử lý, bạn có thể set lại state hoặc thực hiện các bước tiếp theo
    setSelectedComponent(resultMain);
    setAdditionalComponents(resultOtherOption);
  }, [filteredData]);

  const validateOptionsSerial = () => {
    const newErrors: InputErrors = {};
    let hasError = false;
    additionalComponents.forEach((additionalComponent: any) => {
      const { serial_no, additional_component } = additionalComponent;
      const selected = dataTotalProduct?.founds
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
    selectedComponent?.reduce((acc: any, currentValue: any) => {
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

  const getAdditionalComponents = (
    e: React.ChangeEvent<HTMLInputElement>,
    serial: any
  ) => {
    const value = e.target.value;

    // Tìm xem serial_no đã tồn tại trong mảng chưa
    const objIndex = additionalComponents.findIndex(
      (obj: any) => obj.serial_no === serial
    );

    let newArray = [...additionalComponents];

    if (objIndex !== -1) {
      // Nếu đã tồn tại, cập nhật giá trị
      newArray[objIndex].additional_component = value;
    } else {
      // Nếu chưa tồn tại, thêm mới phần tử
      newArray.push({ serial_no: serial, additional_component: value });
    }

    setAdditionalComponents(newArray);
  };

  console.log({ additionalComponents });

  const _handleUpdateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      selected_serials: selectedSerialNumber,
      selected_components: mergedData,
      additional_components: additionalComponents,
    };

    if (!validateOptionsSerial()) {
      return;
    }

    setUpdating(true);

    axiosInstanceV2
      .put(
        api.updateProjectCode(
          edit.invoice_id,
          edit.project_code,
          edit.fab_year,
          edit.contact_person,
          edit.contact_number,
          edit.driver_mode,
          edit.client_ref,
          edit.remark,
          updateDate
        ),
        payload, // Payload là dữ liệu cần gửi
        {
          headers, // Cấu hình headers
        }
      )
      .then((res) => {
        console.log(res);
        navigate(`/home`);
        queryClient.invalidateQueries({ queryKey: ["dataLogisticDelivered"] });
        queryClient.invalidateQueries({ queryKey: ["dataLogisticOngoing"] });
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => setUpdating(false));
  };

  return (
    <div className="py-10 px-48">
      <h3 className="text-lg font-bold mb-10">Update PDO</h3>
      <div>
        <form
          ref={updateInvoiceFormRef}
          onSubmit={(e) => _handleUpdateInvoice(e)}
        >
          <div className="grid gap-3">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Generate Date
              </label>
              <DatePicker
                className="input input-bordered w-full"
                selected={editDate}
                onChange={(date) => {
                  const newDate = date || editDate; // Nếu không sửa, lấy giá trị từ API
                  setEdit((prev: any) => ({
                    ...prev,
                    date: newDate,
                  }));
                }}
                disabled={true}
                placeholderText="dd/mm/yyyy"
                dateFormat="dd/MM/yyyy"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Year
              </label>
              {isLoadingFabYear ? (
                <FadeLoader
                  loading={isLoadingFabYear}
                  cssOverride={overrideSerial}
                  color="red"
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              ) : (
                <input
                  required
                  // value={edit.fab_year}
                  value={edit.fab_year || ""}
                  disabled={true}
                  type="text"
                  placeholder="Fab Year"
                  className="input input-bordered w-full"
                />
              )}
            </div>
            {/* project code */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Project Code
              </label>
              <input
                required
                value={edit.project_code}
                disabled={true}
                type="text"
                placeholder="Contact person"
                className="input input-bordered w-full"
              />
            </div>

            {/* serial number */}
            <div>
              {isLoadingComponent ? (
                <FadeLoader
                  loading={isLoadingComponent}
                  cssOverride={overrideSerial}
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
                              checked={selectedSerialNumber.includes(item)} // Kiểm tra nếu item đã có trong selectedSerialNumber
                              value={item}
                              onChange={(event) =>
                                getSelectedSerialNumber(event)
                              }
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

            {/* component */}

            <div>
              {selectedSerialNumber.map(
                (serial: string | number, index: string) => (
                  <fieldset key={index}>
                    <legend className="block text-gray-700 text-sm font-bold mb-2">
                      Components - {serial}
                    </legend>
                    <div>
                      <div className="flex flex-wrap gap-3">
                        {dataTotalProduct?.founds
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
                                  checked={selectedComponent.some(
                                    (item: any) =>
                                      item.serial_no === serial &&
                                      item.components.includes(component)
                                  )}
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
                            checked={additionalComponents?.some(
                              (item: any) => item.serial_no === serial
                            )}
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
                              value={
                                additionalComponents?.find(
                                  (item: any) => item.serial_no === serial
                                )?.additional_component
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

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Person
              </label>
              <input
                required
                value={edit.contact_person}
                onChange={(event) =>
                  setEdit((prev: any) => ({
                    ...prev,
                    contact_person: event.target.value,
                  }))
                }
                type="text"
                placeholder="Contact person"
                className="input input-bordered w-full"
              />
            </div>

            {/* mode of delivery */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Mode of Delivery
              </label>
              <select
                name="selectedYeaer"
                value={edit.driver_mode}
                required
                onChange={(event) =>
                  setEdit((prev: any) => ({
                    ...prev,
                    driver_mode: event.target.value,
                  }))
                }
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

            {/* contact nunber */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Number
              </label>
              <input
                required
                value={edit.contact_number}
                onChange={(event) =>
                  setEdit((prev: any) => ({
                    ...prev,
                    contact_number: event.target.value,
                  }))
                }
                type="text"
                placeholder="Contact number"
                className="input input-bordered w-full"
              />
            </div>

            {/* client ref */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Client Ref
              </label>
              <input
                required
                value={edit.client_ref}
                onChange={(event) =>
                  setEdit((prev: any) => ({
                    ...prev,
                    client_ref: event.target.value,
                  }))
                }
                type="text"
                placeholder="Client Ref"
                className="input input-bordered w-full"
              />
            </div>

            {/* remark */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Remark
              </label>
              <input
                required
                value={edit.remark}
                onChange={(event) =>
                  setEdit((prev: any) => ({
                    ...prev,
                    remark: event.target.value,
                  }))
                }
                type="text"
                placeholder="Remark"
                className="input input-bordered w-full"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${updating && "loading"}`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
