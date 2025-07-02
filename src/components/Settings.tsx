import React, { useState } from 'react';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

const SettingsPage = () => {
  const [doubleBooking, setDoubleBooking] = useState(false);
  const [waiversEnabled, setWaiversEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6 space-x-3">
        <Settings className="h-6 w-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="bg-white/5 rounded-xl p-6 space-y-6 border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Allow Double Booking</span>
          <button
            onClick={() => setDoubleBooking(!doubleBooking)}
            className="text-white hover:opacity-80"
          >
            {doubleBooking ? <ToggleRight className="text-green-400" /> : <ToggleLeft className="text-gray-400" />}
          </button>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Enable Waivers</span>
          <button
            onClick={() => setWaiversEnabled(!waiversEnabled)}
            className="text-white hover:opacity-80"
          >
            {waiversEnabled ? <ToggleRight className="text-green-400" /> : <ToggleLeft className="text-gray-400" />}
          </button>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Email Notifications</span>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="text-white hover:opacity-80"
          >
            {notificationsEnabled ? <ToggleRight className="text-green-400" /> : <ToggleLeft className="text-gray-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
