import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo } from "react";
import { FadeLoader } from "react-spinners";
import AuthContext, { AuthContextType } from "../../../context/AuthProvider";
import { api } from "../../../service/api/endpoint";
import { axiosInstanceV2 } from "../../../service/hooks/axiosInstance";
import { overrideSerial } from "../EditProjectExample";

const SerinalNo = ({
  numbericId,
  edit,
  listSerialNumber,
  selectedSerialNumber,
  setSelectedSerialNumber,
  setSelectedComponent,
  selectedComponent,
  setAdditionalComponents,
  additionalComponents,
  setListSerialNumber,
  dataDetail,
  errors,
  dataTotalComponent,
}: {
  numbericId: number;
  edit: any;
  listSerialNumber: any;
  selectedSerialNumber: any;
  setSelectedSerialNumber: any;
  setSelectedComponent: any;
  selectedComponent: any;
  setAdditionalComponents: any;
  additionalComponents: any;
  setListSerialNumber: any;
  dataDetail: any;
  errors: any;
  setErrors: any;
  dataTotalComponent: any;
}) => {
  const { auth } = useContext(AuthContext) as AuthContextType;
  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };

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
      alert("The system is overloaded, please reload the webpage.");
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
    staleTime: 0, // Dữ liệu được coi là "stale" ngay lập tức
    gcTime: 0, // Không lưu cache, buộc gọi lại API mỗi lần
    enabled: !!edit?.fab_year && !!numbericId && !!edit?.project_code, // Chỉ gọi API khi fab_year đã có
  });

  useEffect(() => {
    if (!dataTotalProduct) return;
    const serialNumbers = dataTotalProduct?.founds?.map(
      (item: any) => item["serial_no"]
    );
    dataTotalComponent(dataTotalProduct);
    setListSerialNumber(serialNumbers);
  }, [isLoadingComponent, dataTotalProduct]);

  const filteredData = useMemo(() => {
    if (!dataDetail) return [];

    return dataDetail?.data?.filter(
      (item: any) => item.delivery_no === dataDetail.delivery_order_ref
    );
  }, [dataDetail]);

  useEffect(() => {
    if (filteredData?.length > 0) {
      const serialNumbers = filteredData.map((item: any) => item.serial_no);

      // Xóa duplicate nếu cần và cập nhật state
      const uniqueSerialNumbers = Array.from(new Set(serialNumbers));
      setSelectedSerialNumber(uniqueSerialNumbers);
    }
  }, [isLoadingComponent]);

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
  }, [isLoadingComponent]);

  return (
    <div>
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
                  {listSerialNumber?.map((item: any, index: number) => (
                    <div key={item} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        name="serial"
                        checked={selectedSerialNumber.includes(item)} // Kiểm tra nếu item đã có trong selectedSerialNumber
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

      {/* component */}

      <div>
        {selectedSerialNumber.map((serial: string | number, index: string) => (
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
                      <div key={index} className="flex items-center gap-3">
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
                    onChange={(event) => getSelectedComponents(event, serial)}
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
        ))}
      </div>
    </div>
  );
};

export default SerinalNo;
