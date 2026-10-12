// Registers only the Chart.js parts the dashboard uses, so the rest of the library is tree-shaken
// away. The controllers are registered by their vue-chartjs components. Import this module from
// chart components only: it keeps Chart.js inside the lazy dashboard chunk.
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
)
