import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CSSProperties, useContext, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import AuthContext, { AuthContextType } from "../../context/AuthProvider";
import { api } from "../../service/api/endpoint";
import { axiosInstanceV2 } from "../../service/hooks/axiosInstance";
import SerinalNo from "./SerinalNo/SerinalNo";

export const overrideSerial: CSSProperties = {
  display: "flex",
  // margin: "500px auto",
  borderColor: "red",
  fontSize: "50px",
};

const ListModeOfDelivery = [
  { value: "Self Collection", label: "Self Collection" },
  { value: "Delta Tech", label: "Site Delivery" },
];

export interface InputErrors {
  [key: string]: boolean;
}

const EditProjectExample = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const updateInvoiceFormRef = useRef(null);
  const [editDate, setEditDate] = useState<any>(new Date());
  const [updating, setUpdating] = useState<boolean>(false);

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

  const [errors, setErrors] = useState<InputErrors>({});
  const [updateDate, setUpdateDate] = useState<any>("");
  const [listSerialNumber, setListSerialNumber] = useState<string[]>([]);

  const [selectedSerialNumber, setSelectedSerialNumber] = useState<any>([]);
  const [selectedComponent, setSelectedComponent] = useState<any>([]);
  const [additionalComponents, setAdditionalComponents] = useState<any>([]);
  const [dataTotalComponent, setDataTotalComponent] = useState<any>([]);

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
      alert("The system is overloaded, please reload the webpage.");
    }
  };

  const { data: dataFabYear, isLoading: isLoadingFabYear } = useQuery({
    queryKey: ["dataFabYear", numbericId],
    queryFn: () => fetchFabYearById(numbericId),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const validateOptionsSerial = () => {
    const newErrors: InputErrors = {};
    let hasError = false;
    additionalComponents.forEach((additionalComponent: any) => {
      const { serial_no, additional_component } = additionalComponent;
      const selected = dataTotalComponent?.founds
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
    <div
      className={`relative ${updating ? "pointer-events-none opacity-50" : ""}`}
    >
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
              <SerinalNo
                numbericId={numbericId}
                edit={edit}
                listSerialNumber={listSerialNumber}
                selectedSerialNumber={selectedSerialNumber}
                setSelectedSerialNumber={setSelectedSerialNumber}
                setSelectedComponent={setSelectedComponent}
                selectedComponent={selectedComponent}
                setAdditionalComponents={setAdditionalComponents}
                additionalComponents={additionalComponents}
                setListSerialNumber={setListSerialNumber}
                dataDetail={dataDetail}
                errors={errors}
                setErrors={setErrors}
                dataTotalComponent={setDataTotalComponent}
              />

              {/* contact person */}
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
  );
};

export default EditProjectExample;
