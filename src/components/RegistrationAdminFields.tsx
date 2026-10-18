import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGISTRATION_STATES, registrationLabel } from "@/lib/registration-status";
import { kyivToday } from "@/lib/calendar-discovery";

export interface RegistrationAdminValue {
  registration_status: string | null;
  registration_opens_on: string | null;
  info_source_url: string | null;
  info_checked_on: string | null;
}

export function registrationAdminPayload(v: RegistrationAdminValue) {
  return {
    registration_status: v.registration_status || null,
    registration_opens_on: v.registration_opens_on || null,
    info_source_url: v.info_source_url?.trim() || null,
    info_checked_on: v.info_checked_on || null,
  };
}

export function RegistrationAdminFields({
  value,
  onChange,
}: {
  value: RegistrationAdminValue;
  onChange: (patch: Partial<RegistrationAdminValue>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
      <div>
        <Label>Стан реєстрації</Label>
        <Select
          value={value.registration_status ?? "unknown"}
          onValueChange={(v) =>
            onChange({ registration_status: v === "unknown" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">Не зазначено</SelectItem>
            {REGISTRATION_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {registrationLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Відкриття реєстрації</Label>
        <Input
          type="date"
          value={value.registration_opens_on ?? ""}
          onChange={(e) => onChange({ registration_opens_on: e.target.value })}
        />
      </div>
      <div>
        <Label>Джерело інформації</Label>
        <Input
          value={value.info_source_url ?? ""}
          onChange={(e) => onChange({ info_source_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label>Дата перевірки</Label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={value.info_checked_on ?? ""}
            onChange={(e) => onChange({ info_checked_on: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ info_checked_on: kyivToday() })}
          >
            Сьогодні
          </Button>
        </div>
      </div>
    </div>
  );
}
