import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// This is a necessary step to register the components Chart.js needs to render the charts.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ReportsPage() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/analytics", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        // Prepare data for the monthly requests bar chart
        const monthlyLabels = res.data.requestsByMonth.map(item => item.month);
        const monthlyCounts = res.data.requestsByMonth.map(item => item.count);
        
        // Prepare data for the top destinations pie chart
        const destinationLabels = res.data.topDestinations.map(item => item.destination);
        const destinationCounts = res.data.topDestinations.map(item => item._count.destination);

        setChartData({
          monthly: {
            labels: monthlyLabels,
            datasets: [{
              label: 'Exeat Requests per Month',
              data: monthlyCounts,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            }]
          },
          destinations: {
            labels: destinationLabels,
            datasets: [{
              label: 'Top Destinations',
              data: destinationCounts,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
            }]
          }
        });
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user]);

  if (isLoading) return <p>Loading reports...</p>;

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Reports & Analytics</h2>
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Requests Over Last 12 Months</h5>
              {chartData?.monthly && chartData.monthly.labels.length > 0 ? (
                <Bar data={chartData.monthly} />
              ) : (
                <p className="text-muted">No monthly request data available to display.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Top 5 Destinations</h5>
              {chartData?.destinations && chartData.destinations.labels.length > 0 ? (
                <Pie data={chartData.destinations} />
              ) : (
                <p className="text-muted">No destination data available to display.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;