import { useQuery } from "@tanstack/react-query";
import React, { CSSProperties, useRef, useState } from "react";
import { FcPrint } from "react-icons/fc";
import { useLocation, useParams } from "react-router-dom";
import { FadeLoader } from "react-spinners";
import { useReactToPrint } from "react-to-print";
import logo2 from "../../../assets/images/logo2.png";
import { api } from "../../service/api/endpoint";
import { axiosInstanceV2 } from "../../service/hooks/axiosInstance";
import UseRefreshToken from "../../service/hooks/useRefreshToken";
import "./InvoiceStyle.css";

export const override: CSSProperties = {
  display: "flex",
  margin: "500px auto",
  borderColor: "red",
};

const header = [
  "No.",
  "Type of Shutter",
  "Shutter No.",
  "Description",
  "Opening width",
  "Opening height",
  "Serial No.",
  // "Date",
  // "Delivery No.",
  // "Name",
  // "Email",
  // "Phone",
];

const headerList = [
  "No.",
  "type_of_shutter",
  "shutter_number",
  "description",
  "opening_width",
  "opening_height",
  "serial_no",
  // "Date",
  // "Delivery No.",
  // "Name",
  // "Email",
  // "Phone",
];

function Invoice() {
  const invoiceContentRef = useRef<any>();

  const { id } = useParams();
  const location = useLocation(); // Lấy thông tin từ query parameters

  const queryParams = new URLSearchParams(location.search);
  const param = queryParams.get("param"); // Lấy giá trị của A
  // const { auth } = useContext(AuthContext) as AuthContextType;
  const auth = localStorage.getItem("authToken");
  const [showText, setShowText] = useState(false);

  const url = auth ? `Bearer ${auth}` : "";
  const headers = {
    Authorization: url,
    accept: "application/json",
    "Content-Type": "application/json",
  };

  const fetchDataDetail = async (id: number) => {
    try {
      return await axiosInstanceV2
        .get(api.getDataDetailLogisticV2(id))
        .then((res) => res.data);
    } catch (error) {
      UseRefreshToken();
      return { error: "Failed to fetch data" };
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["dataDetailProduct", id],
    queryFn: () => fetchDataDetail(id as any),
    enabled: !!url,
  });
  const _handlePrint = useReactToPrint({
    content: () => invoiceContentRef.current,
    documentTitle: "Statement",
  });

  if (isLoading)
    return (
      <FadeLoader
        loading={isLoading}
        cssOverride={override}
        color="red"
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    );

  return (
    <div className="w-[1300px] mx-auto p-10">
      <div className="flex justify-between items-center">
        <div className="text-center mb-5">
          <button
            onClick={_handlePrint}
            className="btn btn-ghost gap-3 capitalize"
          >
            <FcPrint size={24} />
            Print
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="checkbox"
            name="serial"
            onChange={() => setShowText(!showText)}
          />
          <span className="label-text">Show Overall Components</span>
        </div>
      </div>
      <div>
        <div id="capture" className="invoice-container" ref={invoiceContentRef}>
          <div className="flex justify-between p-1">
            <img className="w-[500px]" src={logo2} alt="logo" />

            <div className="text-right text-sm">
              <p className="font-bold text-blue-600">
                No.34 Loyang Crescent <br /> Singapore 508993
              </p>
              <p>
                <strong>T:</strong> <a href="tel:+6562857813">+65 6285 7813</a>
              </p>
              <p>
                <strong>E:</strong>{" "}
                <a href="mailto:enquiry@deltatech.com.sg">
                  enquiry@deltatech.com.sg
                </a>
              </p>
              <p>
                <strong>W:</strong>{" "}
                <a target="_black" href="www.deltatech.com.sg">
                  www.deltatech.com.sg
                </a>
              </p>
            </div>
          </div>
          <table className="table table-compact w-full">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th className="capitalize text-lg text-center" colSpan={4}>
                    Project Delivery Order (PDO)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Customer</th>
                  <td>{data["company"]}</td>
                  <th>Date</th>
                  <td>{data["created_at"]}</td>
                </tr>
                <tr>
                  <th>Location</th>
                  <td>{data["location"]}</td>
                  <th>Delivery Order Ref</th>
                  <td>{data["delivery_order_ref"]}</td>
                </tr>
                <tr>
                  <th>Contact Person</th>
                  <td>{data["contact_person"]}</td>
                  <th>Project Ref No</th>
                  <td>{data["project_code"]}</td>
                </tr>
                <tr>
                  <th>Contact No</th>
                  <td>{data["contact_number"]}</td>
                  <th>Client Ref</th>
                  <td>{data["client_ref"]}</td>
                </tr>
              </tbody>
            </table>

            <table className="table table-compact w-full">
              <thead className="mt-7">
                <tr className="mt-7">
                  {header.map((item, index) => (
                    <th className="capitalize" key={index}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              {/* !showText && */}
              {/* checkbox => condition : no condition */}
              <tbody>
                {!showText &&
                  data["data"] &&
                  data["data"].map((item: any, index: any) => {
                    return (
                      <tr key={index + 1}>
                        {item["delivery_no"] === data["delivery_order_ref"] &&
                          headerList.map((header, headerIndex) => {
                            switch (header) {
                              case "No.":
                                return <th>{index + 1}</th>;
                              case "description":
                                return (
                                  <td
                                    key={headerIndex}
                                    className="w-full whitespace-pre-wrap inline-block"
                                  >
                                    {item["description"]}
                                    <br />
                                    <div className="text-[12px]">
                                      Sub components:
                                      <br />
                                      {item["sub_components"] &&
                                        item["sub_components"].length > 0 &&
                                        item["sub_components"].map(
                                          (comp: any, compIndex: any) => {
                                            return (
                                              <React.Fragment key={compIndex}>
                                                - {comp}
                                                <br />
                                              </React.Fragment>
                                            );
                                          }
                                        )}
                                    </div>
                                  </td>
                                );
                              case "shutter_number":
                                return (
                                  <td key={headerIndex}>
                                    {item["shutter_number"]}
                                  </td>
                                );
                              default:
                                return (
                                  <td key={headerIndex}>{item[header]}</td>
                                );
                            }
                          })}
                      </tr>
                    );
                  })}
                <tr className="text-center w-full">
                  <th colSpan={100}>Remark: {data["remark"]}</th>
                </tr>
              </tbody>
            </table>
            <table className="table table-compact w-full">
              <tr className="acknowledgement">
                <th className="capitalize text-lg text-center" colSpan={6}>
                  Acknowlegdement
                </th>
              </tr>
              <tbody>
                {/* Logistic Personal */}
                {(param === "Logistic Personal" ||
                  param === "Driver" ||
                  param === "Supervisor") && (
                  <>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        Uploaded By Logistic Personnal
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        Signature
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        Picture
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["loading_by"] !== null && data["loading_by"]}
                      </th>
                      <th colSpan={2} className="text-center  w-1/3">
                        {data["loading_sign"] !== null && (
                          <img
                            src={data["loading_sign"]}
                            alt="Loading Sign"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        {data["loading_img"] !== null && (
                          <img
                            src={data["loading_img"]}
                            alt="Loading Sign"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>
                    </tr>
                  </>
                )}

                {/* Driver */}
                {(param === "Driver" || param === "Supervisor") && (
                  <>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        Uploaded By Driver
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        Signature
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        Picture
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["driver_by"] !== null && data["driver_by"]}
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["driver_sign"] !== null && (
                          <img
                            src={data["driver_sign"]}
                            alt="driver Sign"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        {data["driver_img"] !== null && (
                          <img
                            src={data["driver_img"]}
                            alt="driver img"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>
                    </tr>
                  </>
                )}

                {/* Supervisor */}
                {param === "Supervisor" && (
                  <>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        Uploaded By Supervisor
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        Signature
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        Picture
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["unload_by"] !== null && data["unload_by"]}
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["unload_sign"] !== null && (
                          <img
                            src={data["unload_sign"]}
                            alt="unload Sign"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        {data["unload_img"] !== null && (
                          <img
                            src={data["unload_img"]}
                            alt="unload img"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>
                    </tr>
                  </>
                )}

                {/* Client */}
                {param === "Client" && (
                  <>
                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        Client Name
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        Signature
                      </th>{" "}
                      <th colSpan={2} className="text-center w-1/3">
                        Picture
                      </th>
                    </tr>

                    <tr>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["name"] !== null && data["name"]}
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["client_img"] !== null && (
                          <img
                            src={data["client_img"]}
                            alt="Client img"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>
                      <th colSpan={2} className="text-center w-1/3">
                        {data["client_sign"] !== null && (
                          <img
                            src={data["client_sign"]}
                            alt="Client Sign"
                            style={{
                              maxWidth: "50%",
                              height: "auto",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </th>{" "}
                    </tr>
                  </>
                )}
                {param === "Client" && (
                  <>
                    <tr>
                      <td colSpan={2}>Contact: {data["phone"]}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}>Email: {data["email"]}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        Deltatech Personal Support: {data["client_supporter"]}
                      </td>
                    </tr>
                  </>
                )}

                <tr>
                  <td className="p-10"></td>
                </tr>
              </tbody>
            </table>
            <tfoot>
              <tr>
                <td>
                  <div id="page-number">
                    {" "}
                    Delivery Order Ref: {data["delivery_order_ref"]}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Invoice;
