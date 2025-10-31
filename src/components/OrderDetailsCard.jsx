import React, { useEffect, useState } from "react";
import { MapPin, FileText, Car, Bike, ClipboardList, MessageSquare } from "lucide-react";

const OrderDetailsCard = () => {
    const [orderData, setOrderData] = useState(null);

    // Read data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem("punctureRequestFormData");
        if (savedData) {
            setOrderData(JSON.parse(savedData));
        }
    }, []);

    const neumorphicInsetShadow =
        "shadow-[inset_3px_3px_6px_#BABECC,_inset_-3px_-3px_6px_#FFFFFF]";

    if (!orderData) {
        return (
            <div className="text-center text-gray-500 p-4 italic">
                No order details found.
            </div>
        );
    }

    const { problem, vehicleType, location, latitude, longitude, additionalNotes } = orderData;

    const getVehicleIcon = (type) => {
        if (type === "bike") return <Bike size={22} className="text-blue-500" />;
        return <Car size={22} className="text-blue-500" />;
    };

    return (
        <div className={`space-y-1 mb-8 p-3 rounded-xl ${neumorphicInsetShadow}`} >
            <h2 className="text-lg font-bold text-center text-gray-700">Order Details</h2>

            {/* Problem Type */}
            <div
                className={`flex justify-between items-center px-4 py-2   `}
            >
                <div className="flex items-center gap-3">
                    <ClipboardList className="text-blue-500" size={20} />
                    <span className="font-semibold text-gray-700">Problem</span>
                </div>
                <span className="font-mono text-base font-bold text-gray-800">
                    {problem || "N/A"}
                </span>
            </div>

            {/* Vehicle Type */}
            <div
                className={`flex justify-between items-center px-4 py-2   `}
            >
                <div className="flex items-center gap-3">
                    {getVehicleIcon(vehicleType)}
                    <span className="font-semibold text-gray-700">Vehicle Type</span>
                </div>
                <span className="font-mono text-base font-bold text-gray-800 capitalize">
                    {vehicleType || "N/A"}
                </span>
            </div>

            {/* Location */}
            <div
                className={`flex flex-col gap-2 px-4  py-2 `}
            >
                <div className="flex items-center gap-3 mb-1">
                    <MapPin className="text-blue-500" size={20} />
                    <span className="font-semibold text-gray-700">Location</span>
                </div>
                <p className="text-sm text-gray-600 leading-snug">{location}</p>
                <p className="text-xs text-gray-400">
                    Lat: {latitude} | Long: {longitude}
                </p>
            </div>

            {/* Additional Notes */}
            {additionalNotes && (
                <div
                    className={`flex flex-col gap-2 px-4   py-2 `}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <MessageSquare className="text-blue-500" size={20} />
                        <span className="font-semibold text-gray-700">Additional Notes</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">{additionalNotes}</p>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsCard;
