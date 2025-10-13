// src/Page/ProfilePage.js
import React, { useState, useCallback, useEffect } from 'react';
import {
    FaUserCircle, FaEnvelope, FaEdit, FaSave,
    FaTimes, FaSignOutAlt
} from 'react-icons/fa';
import api from '../utils/api';

// --- Reusable Editable Field Component ---
const EditableField = React.memo(({ label, name, value, onChange, type = "text" }) => (
    <div className="mb-4">
        <label className="block text-gray-600 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] outline-none focus:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
        />
    </div>
));

// --- Reusable Order History Card Component ---
const OrderHistoryCard = React.memo(({ order }) => (
    <div className="bg-gray-200 p-4 rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF]">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-gray-800">{order.problem}</p>
                <p className="text-sm text-gray-500">{new Date(order.request_time).toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">{order.location}</p>
            </div>
            <div className={`text-sm font-semibold px-2 py-1 rounded-full ${order.status === 'Completed' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {order.status}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
             <p className="text-sm text-gray-700">Mechanic: <span className="font-semibold">{order.mechanic_name}</span></p>
        </div>
    </div>
));


const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userResponse = await api.get('/Profile/UserProfile/');
                setUser(userResponse.data);
                setEditedUser(userResponse.data);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        const fetchOrderHistory = async () => {
            try {
                const historyResponse = await api.get('/Profile/UserHistory/');
                setOrderHistory(historyResponse.data);
            } catch (error) {
                console.error("Failed to fetch order history", error);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchUserData(), fetchOrderHistory()]);
            setLoading(false);
        }

        fetchData();
    }, []);


    // User editing handlers
    const handleEdit = useCallback(() => {
        setEditedUser(user);
        setIsEditing(true);
    }, [user]);

    const handleSave = useCallback(async () => {
        if (!editedUser.first_name.trim() || !editedUser.email.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editedUser.email)) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const response = await api.post('/Profile/EditUserProfile/', editedUser);
            setUser(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save user data", error);
        }

    }, [editedUser]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditedUser(user);
    }, [user]);

    const handleUserChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-300 flex items-center justify-center">Loading...</div>;
    }


    return (
        <div className="min-h-screen bg-gray-300 text-gray-700 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h1>

                {/* --- User Information Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <FaUserCircle className="text-7xl text-gray-500" />
                        <div className="flex-grow text-center sm:text-left">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <EditableField
                                        label="Name"
                                        name="first_name"
                                        value={editedUser.first_name}
                                        onChange={handleUserChange}
                                    />
                                    <EditableField
                                        label="Email"
                                        name="email"
                                        value={editedUser.email}
                                        onChange={handleUserChange}
                                        type="email"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800">{user.first_name} {user.last_name}</h2>
                                    <p className="text-gray-600 flex items-center justify-center sm:justify-start">
                                        <FaEnvelope className="mr-2" />{user.email}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">Member since {new Date(user.date_joined).toLocaleDateString()}</p>
                                </>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="flex space-x-2 self-start sm:self-auto">
                                <button
                                    onClick={handleSave}
                                    className="p-3 bg-green-400 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                                    aria-label="Save changes"
                                >
                                    <FaSave className="text-white" />
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="p-3 bg-red-400 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition"
                                    aria-label="Cancel changes"
                                >
                                    <FaTimes className="text-white" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEdit}
                                className="p-3 bg-gray-300 rounded-full shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition self-start sm:self-auto"
                                aria-label="Edit profile"
                            >
                                <FaEdit className="text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Order History Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Order History</h3>
                    <div className="space-y-4">
                        {orderHistory.length > 0 ? (
                            orderHistory.map(order => (
                                <OrderHistoryCard key={order.id} order={order} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No past orders found.</p>
                        )}
                    </div>
                </div>

                {/* --- Account Actions Card --- */}
                <div className="bg-gray-200 rounded-2xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] p-6 flex flex-col justify-center">
                    <button className="w-full flex items-center justify-center p-3 bg-red-400 text-white rounded-xl shadow-[3px_3px_6px_#BABECC,-3px_-3px_6px_#FFFFFF] hover:shadow-[inset_1px_1px_2px_#BABECC,inset_-1px_-1px_2px_#FFFFFF] transition font-bold">
                        <FaSignOutAlt className="mr-3" /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;