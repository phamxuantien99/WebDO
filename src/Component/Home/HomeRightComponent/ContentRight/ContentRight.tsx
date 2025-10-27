import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsEyeFill, BsPenFill } from "react-icons/bs";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import AuthContext, { AuthContextType } from "../../../context/AuthProvider";
import { api } from "../../../service/api/endpoint";
import { axiosInstanceV2 } from "../../../service/hooks/axiosInstance";

const override: CSSProperties = {
  display: "flex",
  margin: "300px auto",
  borderColor: "red",
};

const overrideSerial: CSSProperties = {
  display: "flex",
  // margin: "500px auto",
  borderColor: "red",
  fontSize: "50px",
};

const header = [
  "Created At",
  "Delivery Order Ref",
  "Internal",
  "External",
  "Project Code",
  "Company",
  "Contact Person",
  "Contact Number",
  "Mode of Delivery",
  "Client Ref",
  "Remark",
];

const ListModeOfDelivery = [
  { value: "Self Collection", label: "Self Collection" },
  { value: "Delta Tech", label: "Site Delivery" },
];

interface InputErrors {
  [key: string]: boolean;
}

const ContentRight = () => {
  const {
    auth,
    dataAnalysis,
    isLoadingData,
    setSearchQuery,
    setCurrentPage,
    currentPage,
    selectedAnalysis,
  } = useContext(AuthContext) as AuthContextType;
  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };

  const queryClient = useQueryClient();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const totalPages = Math.ceil(dataAnalysis?.search_options?.total_count / 20);

  const [updating, setUpdating] = useState<boolean>(false);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const [editDate, setEditDate] = useState<any>(new Date());
  const [idInvoice, setIdInvoice] = useState<number>(0);
  const [updateDate, setUpdateDate] = useState<any>("");

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

  const [listSerialNumber, setListSerialNumber] = useState<string[]>([]);

  const [selectedSerialNumber, setSelectedSerialNumber] = useState<any>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>([]);
  const [additionalComponents, setAdditionalComponents] = useState<any>([]);
  const [errors, setErrors] = useState<InputErrors>({});

  useEffect(() => {
    setSelectedSerialNumber([]);
    setListSerialNumber([]);
    setSelectedComponent([]);
    setAdditionalComponents([]);
  }, [edit.project_code]);

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

  // call api get fab year by id
  const fetchFabYearById = async (invoice_id: number) => {
    try {
      const response = await axiosInstanceV2.get(
        api.getFabYearById(invoice_id)
      );

      return response.data;
    } catch (error) {
      alert("Failed to fetch data Fab Year");
    }
  };

  const { data: dataFabYear, isLoading: isLoadingFabYear } = useQuery({
    queryKey: ["dataFabYear", edit.invoice_id],
    queryFn: () => fetchFabYearById(edit.invoice_id),
    refetchOnWindowFocus: false,
    enabled: !!edit.invoice_id, // API chỉ được gọi khi edit.fab_year không phải là chuỗi rỗng
  });

  useEffect(() => {
    if (dataFabYear) {
      // Chỉ cập nhật khi dataFabYear có dữ liệu
      setEdit((prev: any) => ({
        ...prev,
        fab_year: dataFabYear.fab_year,
      }));
    }
  }, [dataFabYear]);

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
        api.getComponentByProjectCodeV2(invoice_id, project_code, year),
        {
          headers,
        }
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
      edit?.invoice_id,
      edit?.project_code,
      edit?.fab_year,
    ],
    queryFn: () =>
      fetchDataLogisticComponent(
        edit.invoice_id,
        edit.project_code,
        edit.fab_year
      ),
    refetchOnWindowFocus: false,
    enabled: !!edit?.fab_year && !!edit?.invoice_id && !!edit?.project_code, // Chỉ gọi API khi fab_year đã có
  });

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
      queryKey: ["dataDetailProduct", edit?.invoice_id],
      queryFn: () => fetchDataDetail(edit?.invoice_id as any),
      enabled: !!edit?.invoice_id,
    });
  // filter data để láy cho việc checkbox của serial_no
  const filteredData = useMemo(() => {
    if (!dataProductDetail) return [];

    return dataProductDetail?.data?.filter(
      (item: any) => item.delivery_no === dataProductDetail.delivery_order_ref
    );
  }, [dataProductDetail]);

  useEffect(() => {
    if (filteredData?.length > 0) {
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

  useEffect(() => {
    if (!dataTotalProduct) return;
    const serialNumbers = dataTotalProduct?.founds?.map(
      (item: any) => item["serial_no"]
    );
    setListSerialNumber(serialNumbers);
  }, [isLoadingComponent, dataTotalProduct]);

  const editItem = (item: any) => {
    const dateSplit = item["created_at"].split("/");
    const date = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
    setUpdateDate(date);
    setEditDate(new Date(date));
    setIdInvoice(item["invoice_id"]);
    const payload = {
      contact_person: item["contact_person"],
      contact_number: item["contact_number"],
      client_ref: item["client_ref"],
      driver_mode: item["driver"],
      remark: item["remark"],
      project_code: item["project_code"],
      invoice_id: item["invoice_id"],
      fab_year: item["fab_year"],
    };
    setSelectedSerialNumber([]);
    setListSerialNumber([]);
    setSelectedComponent([]);
    setAdditionalComponents([]);
    setEdit(Object.assign({}, payload));
  };

  const _handleUpdateInvoiceForm = () => {
    document.getElementById("close")?.click();
    setEdit(defaultEdit);
  };

  const updateInvoiceFormRef = useRef(null);

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
        _handleUpdateInvoiceForm();
        queryClient.invalidateQueries({ queryKey: ["dataLogisticDelivered"] });
        queryClient.invalidateQueries({ queryKey: ["dataLogisticOngoing"] });
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => setUpdating(false));
  };

  const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);

  const handleDeleteInvoice = async (id: number, project: string) => {
    setIsLoadingDelete(true);
    try {
      const response = await axiosInstanceV2.put(
        api.deleteInvoiceProject(id, project),
        {
          headers,
        }
      );
      alert(response?.data?.message);

      // Gọi lại dữ liệu mới
      // refetchDataList();

      queryClient.invalidateQueries({ queryKey: ["dataLogisticDelivered"] });
      queryClient.invalidateQueries({ queryKey: ["dataLogisticOngoing"] });
      // Thông báo kết quả thành công nếu cần
      // showToast("Invoice deleted successfully!", "success");
    } catch (error: unknown) {
      console.error("Error deleting invoice:", error);
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const renderUpdateModal = (item: any) => {
    return (
      <div>
        <label
          onClick={() => {
            if (
              !(item["loading_sign"] !== null || item["unload_sign"] !== null)
            ) {
              editItem(item);
            }
          }}
          htmlFor="modal-edit"
          className={`btn modal-button btn-square btn-sm ${
            item["loading_sign"] !== null || item["unload_sign"] !== null
              ? "btn-disabled"
              : ""
          }`}
        >
          <BsPenFill size={16} />
        </label>

        <input type="checkbox" id="modal-edit" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box relative">
            <label
              id="close"
              htmlFor="modal-edit"
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => {
                // Reset lại state khi đóng modal
                setEdit((prev: any) => ({
                  ...prev,
                  invoice_id: 0,
                }));
              }}
            >
              ✕
            </label>
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
                      // disabled={true}
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
                                <div
                                  key={item}
                                  className="flex items-center gap-3"
                                >
                                  <input
                                    type="checkbox"
                                    className="checkbox"
                                    name="serial"
                                    checked={selectedSerialNumber.includes(
                                      item
                                    )} // Kiểm tra nếu item đã có trong selectedSerialNumber
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
                                      <span className="label-text">
                                        {component}
                                      </span>
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
                                <span className="label-text ">
                                  Other option
                                </span>
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
        </div>
      </div>
    );
  };

  const [isLoadingCheckbox, setIsLoadingCheckbox] = useState(false);
  const [checkbox, setCheckbox] = useState<any>({});

  const handleTickerCheckbox = async (id: number) => {
    try {
      setIsLoadingCheckbox(true); // Bật loading
      setCheckbox((prev: any) => ({ ...prev, [id]: true }));
      await axiosInstanceV2.put(api.putTickerLogisticInvoice(id), {
        headers,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update ticker, please contact administrator");
      setCheckbox((prev: any) => ({ ...prev, [id]: false }));
    } finally {
      setIsLoadingCheckbox(false); // Tắt loading
    }
  };

  const navigate = useNavigate();

  return (
    <div className="mx-[auto] w-full">
      {(isLoadingCheckbox || isLoadingDelete) && (
        <div style={styles.overlay}>
          <div style={styles.loader}></div>
        </div>
      )}
      <div
        className="overflow-y-auto "
        // style={{ height: "calc(100vh - 200px)" }}
        style={{ maxHeight: "84vh" }}
      >
        <table className="table w-full">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-center">
                No.
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center">
                Action
              </th>
              {header.map((item, index) =>
                item === "Internal" ? (
                  <th
                    key={index}
                    colSpan={3}
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    {item}
                  </th>
                ) : (
                  <th
                    key={index}
                    className="border border-gray-300 px-4 py-2 text-center"
                  >
                    {item}
                  </th>
                )
              )}
            </tr>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-center"></th>
              <th className="border border-gray-300 px-4 py-2 text-center"></th>
              {header.map((item, index) => {
                if (item === "Internal") {
                  return ["Logistic Personal", "Driver", "Supervisor"].map(
                    (subItem, subIndex) => (
                      <th
                        key={`${index}-${subIndex}`}
                        className="border border-gray-300 px-4 py-2 text-center w-1/3"
                      >
                        {subItem}
                      </th>
                    )
                  );
                }

                if (item === "External") {
                  return (
                    <th
                      key={index}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      Client
                    </th>
                  );
                }

                return (
                  <th
                    key={index}
                    className="border border-gray-300 px-4 py-2 text-center"
                  ></th>
                );
              })}
            </tr>

            <tr>
              <td colSpan={15}>
                <input
                  type="text"
                  placeholder="Search..."
                  onChange={(event) => handleSearch(event.target.value)}
                  className="input input-bordered w-full"
                ></input>
              </td>
            </tr>
          </thead>

          <tbody className="w-full">
            {dataAnalysis?.founds?.map((item: any, index: any) => {
              return (
                <tr key={index} className="hover">
                  <th>{item["invoice_id"]}</th>
                  <td key={"action"}>
                    <div className="flex gap-3 items-center">
                      <div className="p-4">
                        {/* Checkbox */}
                        <div className="flex items-center flex-col">
                          <input
                            type="checkbox"
                            id={`checkbox-${item["invoice_id"]}`}
                            checked={
                              item["ticker"] === "T" ||
                              checkbox[item["invoice_id"]]
                                ? true
                                : false
                            }
                            onChange={() =>
                              handleTickerCheckbox(item["invoice_id"])
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            disabled={
                              (item["ticker"] === "T" ? true : false) ||
                              checkbox[item["invoice_id"]]
                            }
                          />
                        </div>
                      </div>

                      {/* <Link
                        to={`/home/${item["invoice_id"]}`}
                        className="btn btn-square btn-outline btn-sm"
                      >
                        <BsEyeFill size={16} />
                      </Link> */}

                      <button
                        onClick={() => {
                          navigate(`/home/${item["invoice_id"]}`);
                        }}
                        className={`btn btn-square btn-outline btn-sm }`}
                        disabled={
                          item["loading_sign"] !== null ||
                          item["unload_sign"] !== null
                            ? true
                            : false
                        }
                      >
                        <BsEyeFill size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteInvoice(
                            item["invoice_id"],
                            item["project_code"]
                          )
                        }
                        className={`btn btn-square btn-outline btn-sm }`}
                        disabled={
                          item["loading_sign"] !== null ||
                          item["unload_sign"] !== null
                            ? true
                            : false
                        }
                      >
                        <RiDeleteBin6Line size={16} />
                      </button>

                      {/* {getRoleAdmin && <>{renderUpdateModal(item)}</>} */}
                      <button
                        onClick={() => {
                          navigate(`/home/update/${item["invoice_id"]}`, {
                            state: item,
                          });
                        }}
                        className={`btn modal-button btn-square btn-sm ${
                          item["loading_sign"] !== null ||
                          item["unload_sign"] !== null
                            ? "btn-disabled"
                            : ""
                        }`}
                      >
                        <BsPenFill size={16} />
                      </button>
                    </div>
                  </td>

                  <td>{item["created_at"]}</td>
                  <td>{item["delivery_order_ref"]}</td>

                  {/* loading */}

                  {item["loading_sign"] === null ? (
                    <td className="text-red-500 text-left">
                      Not signed{" "}
                      <span>
                        <Link
                          to={`/home/${
                            item["invoice_id"]
                          }?param=${"Logistic Personal"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  ) : (
                    <td className="text-green-500 text-center">
                      Signed{" "}
                      <span>
                        <Link
                          to={`/home/${
                            item["invoice_id"]
                          }?param=${"Logistic Personal"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  )}

                  {/* driver */}

                  {item["driver_sign"] === null ? (
                    <td className="text-red-500 text-left">
                      Not signed{" "}
                      <span>
                        <Link
                          to={`/home/${item["invoice_id"]}?param=${"Driver"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  ) : (
                    <td className="text-green-500 text-center">
                      Signed{" "}
                      <span>
                        <Link
                          to={`/home/${item["invoice_id"]}?param=${"Driver"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  )}

                  {/* supervisor */}

                  {item["unload_sign"] === null ? (
                    <td className="text-red-500 text-left">
                      Not signed{" "}
                      <span>
                        <Link
                          to={`/home/${
                            item["invoice_id"]
                          }?param=${"Supervisor"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  ) : (
                    <td className="text-green-500 text-center">
                      Signed{" "}
                      <span>
                        <Link
                          to={`/home/${
                            item["invoice_id"]
                          }?param=${"Supervisor"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  )}

                  {/* client */}

                  {item["client_sign"] === null ? (
                    <td className="text-red-500 text-left">
                      Not signed{" "}
                      <span>
                        <Link
                          to={`/home/${item["invoice_id"]}?param=${"Client"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  ) : (
                    <td className="text-green-500 text-center">
                      Signed{" "}
                      <span>
                        <Link
                          to={`/home/${item["invoice_id"]}?param=${"Client"}`}
                          className="btn btn-square btn-outline btn-sm"
                        >
                          <BsEyeFill size={16} />
                        </Link>
                      </span>
                    </td>
                  )}

                  <td>{item["project_code"]}</td>
                  <td>{item["company"]}</td>
                  <td>{item["contact_person"]}</td>
                  <td>{item["contact_number"]}</td>
                  <td>{item["driver"]}</td>
                  <td>{item["client_ref"]}</td>
                  <td>{item["remark"]}</td>
                </tr>
              );
            })}
            <tr>
              {!isLoadingData &&
                (dataAnalysis?.founds?.length === 0 ||
                  dataAnalysis?.list_component?.length === 0) && (
                  <td
                    colSpan={header.length + 2}
                    className={"text-center text-red-500"}
                  >
                    No results
                  </td>
                )}
              {isLoadingData && (
                <td
                  colSpan={header.length + 2}
                  className={"text-center text-red-500"}
                >
                  <FadeLoader
                    loading={isLoadingData}
                    cssOverride={override}
                    color="red"
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                </td>
              )}
            </tr>
            <tr>
              {!isLoadingData &&
                dataAnalysis?.error === "Permission denied" && (
                  <td
                    colSpan={header.length + 2}
                    className="text-center text-red-500"
                  >
                    You do not have permission to access this data.
                  </td>
                )}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex bg-white rounded-lg font-[Poppins] align-center items-center">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange((currentPage as number) - 1)}
          className="h-12 border-2 border-r-0 border-indigo-600
               px-4 rounded-l-lg hover:bg-indigo-600 hover:text-white"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
              fill-rule="evenodd"
            ></path>
          </svg>
        </button>
        <p className="font-bold mx-2">{`Page ${currentPage} of ${totalPages}`}</p>
        <button
          onClick={() => handlePageChange((currentPage as number) + 1)}
          disabled={currentPage === totalPages}
          className="h-12 border-2  border-indigo-600
               px-4 rounded-r-lg hover:bg-indigo-600 hover:text-white"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
              fill-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ContentRight;

const styles = {
  overlay: {
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loader: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderRadius: "50%",
    borderTop: "5px solid #3498db",
    animation: "spin 1s linear infinite",
  },
};
