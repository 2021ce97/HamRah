import React from 'react';

export default function AdminDashboard() {
  const metrics = [
    { title: 'Total Riders', value: '12,450', change: '+12%', color: 'border-blue-500' },
    { title: 'Active Drivers', value: '840', change: '+5%', color: 'border-green-500' },
    { title: 'Rides Today', value: '3,210', change: '+24%', color: 'border-[#D4AF37]' },
    { title: 'Commission Revenue', value: '450,000 ؋', change: '+18%', color: 'border-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Overview Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${metric.color}`}>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{metric.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm font-semibold text-green-600">{metric.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Rides Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Rides</h2>
            <button className="text-sm text-[#D4AF37] font-medium hover:underline">View All Map</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-sm border-b">
                  <th className="pb-3 font-medium">Rider</th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Fare</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-50">
                  <td className="py-4 font-medium text-gray-900">Ahmad N.</td>
                  <td className="py-4 text-gray-600">Farid T.</td>
                  <td className="py-4 text-gray-600">Pul-e-Sorkh → Shahr-e-Naw</td>
                  <td className="py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">In Progress</span></td>
                  <td className="py-4 font-medium">150 ؋</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-4 font-medium text-gray-900">Zahra K.</td>
                  <td className="py-4 text-gray-600">Mahmoud R.</td>
                  <td className="py-4 text-gray-600">Kabul Univ → Kote Sangi</td>
                  <td className="py-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Negotiating</span></td>
                  <td className="py-4 font-medium">--</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Driver Verifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Approvals</h2>
          
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Driver #{200 + item}</p>
                  <p className="text-xs text-gray-500">Tazkira uploaded</p>
                </div>
                <button className="bg-[#D4AF37] text-white px-3 py-1 rounded text-xs font-bold">
                  Review
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-center text-sm text-gray-500 font-medium hover:text-gray-800">
            View 12 more applications
          </button>
        </div>
      </div>
    </div>
  );
}
