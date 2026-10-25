import { Route, Routes } from 'react-router';
import {
  AgeStep,
  CheckStep,
  DeptStep,
  GenderStep,
  MobileStep,
  NameStep,
  RegisterLayout,
  RegisterSigns,
} from './patient/Register';
import { Board } from './board/Board';
import { Counter } from './staff/Counter';
import { Dashboard } from './staff/Dashboard';
import { OutOfServicePage } from './staff/OutOfService';
import { Find } from './patient/Find';
import { Slip } from './patient/Slip';
import { TokenEntry } from './patient/TokenEntry';
import { Turn } from './patient/Turn';
import { Emergency } from './shell/Emergency';
import { Home } from './shell/Home';
import { SettingsScreen } from './shell/SettingsScreen';
import { Shell } from './shell/Shell';

/** Patient routes. The router itself is set in main.tsx, so tests can use a MemoryRouter. */
export function App() {
  return (
    <Routes>
      {/* A TV display, so no patient shell. It carries its own Emergency line. */}
      <Route path="board" element={<Board />} />
      <Route path="staff" element={<Dashboard />} />
      <Route path="staff/counter" element={<Counter />} />
      <Route path="staff/places" element={<OutOfServicePage />} />
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="register" element={<RegisterLayout />}>
          <Route index element={<RegisterSigns />} />
          <Route path="name" element={<NameStep />} />
          <Route path="age" element={<AgeStep />} />
          <Route path="gender" element={<GenderStep />} />
          <Route path="mobile" element={<MobileStep />} />
          <Route path="dept" element={<DeptStep />} />
          <Route path="check" element={<CheckStep />} />
        </Route>
        <Route path="slip/:token" element={<Slip />} />
        <Route path="token" element={<TokenEntry />} />
        <Route path="turn/:token" element={<Turn />} />
        <Route path="find" element={<Find />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
