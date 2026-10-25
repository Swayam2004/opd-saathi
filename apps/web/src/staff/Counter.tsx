import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { departments, type DeptCode } from '@shared/data/departments.ts';
import type { Gender } from '@shared/data/patients.ts';
import { Icon } from '../components/Icon';
import { validAge, validMobile, validName } from '../patient/draft';
import { useT } from '../shell/useT';
import { useStore } from '../store/localStore';

const FIELD = 'min-h-14 w-full rounded-xl border-2 border-line bg-card px-3 text-xl text-ink';

/**
 * Registration counter (S8): staff register a patient with no phone in a few taps,
 * then open the slip to print it. The emergency signs are the patient flow's first
 * screen; here staff ask in person.
 */
export function Counter() {
  const tr = useT();
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('unsaid');
  const [dept, setDept] = useState<DeptCode>('MED');
  const [mobile, setMobile] = useState('');
  const [token, setToken] = useState<string>();
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!validName(name)) return setError(tr('register.error.name'));
    if (!validAge(age)) return setError(tr('register.error.age'));
    if (!validMobile(mobile)) return setError(tr('register.error.mobile'));
    const m = mobile.replace(/\s/g, '');
    const o = dispatch({ type: 'register', reg: { firstName: name.trim(), age: Number(age), gender, dept, ...(m ? { mobile: m } : {}) } });
    if (o.ok && o.token) {
      setToken(o.token);
      setError(undefined);
    } else setError(tr('staff.error', { error: o.ok ? '' : o.error }));
  };

  const reset = (): void => {
    setName('');
    setAge('');
    setGender('unsaid');
    setMobile('');
    setToken(undefined);
  };

  return (
    <div className="min-h-dvh bg-page p-4 text-ink">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Link to="/staff" className="flex min-h-14 items-center gap-2 font-semibold">
          <Icon name="back" />
          {tr('staff.title')}
        </Link>
        <h1 className="text-2xl font-bold">{tr('staff.counter.title')}</h1>
        <p className="m-0 text-base text-muted">{tr('register.noIds')}</p>

        {token ? (
          <div role="status" className="flex flex-col gap-3 rounded-2xl border-4 border-brand bg-soft p-4">
            <p className="m-0 text-2xl font-bold">{tr('staff.counter.done', { token })}</p>
            <Link to={`/slip/${token}`} target="_blank" className="flex min-h-14 items-center gap-2 rounded-xl border-2 border-brand bg-brand px-4 text-xl font-semibold text-brand-ink">
              <Icon name="slip" />
              {tr('staff.counter.print')}
            </Link>
            <button type="button" onClick={reset} className="flex min-h-14 items-center gap-2 rounded-xl border-2 border-line bg-card px-4 font-semibold">
              <Icon name="register" />
              {tr('staff.counter.again')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              {tr('slip.name')}
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="off" className={FIELD} />
            </label>
            <label className="flex flex-col gap-1">
              {tr('register.age.q')}
              <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" maxLength={3} autoComplete="off" className={FIELD} />
            </label>
            <label className="flex flex-col gap-1">
              {tr('register.gender.q')}
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={FIELD}>
                <option value="woman">{tr('register.gender.woman')}</option>
                <option value="man">{tr('register.gender.man')}</option>
                <option value="other">{tr('register.gender.other')}</option>
                <option value="unsaid">{tr('register.gender.skip')}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              {tr('slip.dept')}
              <select value={dept} onChange={(e) => setDept(e.target.value as DeptCode)} className={FIELD}>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {tr(`dept.${d.code}`)}: {tr(`dept.${d.code}.hint`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              {tr('register.mobile.q')}
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" inputMode="numeric" maxLength={12} autoComplete="off" className={FIELD} />
            </label>
            {error && (
              <p role="alert" className="flex items-center gap-2 font-semibold text-danger">
                <Icon name="alert" className="size-6" />
                {error}
              </p>
            )}
            <button type="submit" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-brand px-4 text-xl font-semibold text-brand-ink">
              <Icon name="slip" />
              {tr('staff.counter.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
