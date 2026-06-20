/**
 * EVM (Earned Value Management) & Cognitive Scheduler Agent
 * Calculates PV (Planned Value), EV (Earned Value), AC (Actual Cost), SV, CV, SPI, CPI
 */

export function calculateEVM(tasks = []) {
  let totalPV = 0;
  let totalEV = 0;
  let totalAC = 0;

  const results = tasks.map(task => {
    const pv = task.plannedBudget * (task.plannedProgressPercentage / 100);
    const ev = task.plannedBudget * (task.actualProgressPercentage / 100);
    const ac = task.actualCost;

    totalPV += pv;
    totalEV += ev;
    totalAC += ac;

    const sv = ev - pv; // Schedule Variance
    const cv = ev - ac; // Cost Variance
    const spi = pv > 0 ? ev / pv : 1.0; // Schedule Performance Index
    const cpi = ac > 0 ? ev / ac : 1.0; // Cost Performance Index

    return {
      taskId: task.id,
      taskName: task.name,
      PV: Number(pv.toFixed(2)),
      EV: Number(ev.toFixed(2)),
      AC: Number(ac.toFixed(2)),
      SV: Number(sv.toFixed(2)),
      CV: Number(cv.toFixed(2)),
      SPI: Number(spi.toFixed(2)),
      CPI: Number(cpi.toFixed(2)),
      status: spi >= 1.0 && cpi >= 1.0 ? 'ON_TRACK' : (spi < 0.9 || cpi < 0.9 ? 'CRITICAL' : 'WARNING')
    };
  });

  const aggregateSV = totalEV - totalPV;
  const aggregateCV = totalEV - totalAC;
  const aggregateSPI = totalPV > 0 ? totalEV / totalPV : 1.0;
  const aggregateCPI = totalAC > 0 ? totalEV / totalAC : 1.0;

  return {
    tasks: results,
    totals: {
      PV: Number(totalPV.toFixed(2)),
      EV: Number(totalEV.toFixed(2)),
      AC: Number(totalAC.toFixed(2)),
      SV: Number(aggregateSV.toFixed(2)),
      CV: Number(aggregateCV.toFixed(2)),
      SPI: Number(aggregateSPI.toFixed(2)),
      CPI: Number(aggregateCPI.toFixed(2))
    },
    recommendation: aggregateCPI < 0.9 ? 'Review resource allocation and identify cost leaks.' : (aggregateSPI < 0.9 ? 'Crash critical path activities to regain schedule.' : 'Project is performing healthy.')
  };
}
