"use client";
import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";  // Use apiGet instead of axios for consistency
import { useAuth } from "@/context/AuthContext";  // Add missing import
import { toast } from "react-toastify";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define status colors (use this object instead of inline classes)
  const statusColor = {
    SUCCESS: "text-green-600",
    VERIFICATION_PENDING: "text-yellow-600",
    PENDING: "text-blue-600",
    REJECTED: "text-red-600",
  };

  useEffect(() => {
    if (user) {
      fetchOrders();  // Call only inside useEffect
    } else {
      setLoading(false);  // If no user, stop loading
    }
  }, [user]);  // Add user as dependency

  const fetchOrders = async () => {
    try {
      const data = await apiGet("/orders/orders/my-orders/");  // Use apiGet (handles auth headers)
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show message
  if (!user) {
    return <div className="p-6 text-center">Please log in to view your orders.</div>;
  }

  if (loading) return <div className="p-6 text-center">Loading orders...</div>;
  if (orders.length === 0)
    return <div className="p-6 text-center">No orders found 😕</div>;

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-xl shadow-md">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Order ID:</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Status:</span>
              <span className={`${statusColor[order.payment_status] || "text-gray-600"} font-bold`}>
                {order.payment_status.replaceAll("_", " ")}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Courses:</span>
              <ul className="list-disc list-inside">
                {order.items?.map((item, idx) => (
                  <li key={idx}>
                    {item.course_title} - ₹{item.price}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">Total Paid:</span>
              <span>₹{order.final_amount}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}