'use client';
import { useState } from 'react';
import { Slider as Range } from '@base-ui/react/slider';
import { money } from '@/lib/catalog';
export default function PriceFilter({
  bounds,
  min,
  max,
  onChange,
}: {
  bounds?: { min: number; max: number } | null;
  min: string;
  max: string;
  onChange: (range: { min: string; max: string }) => void;
}) {
  const lower = Math.min(
    bounds?.min ?? 0,
    min ? Math.round(Number(min) * 100) : Infinity,
  );
  const upper = Math.max(
    bounds?.max ?? 0,
    max ? Math.round(Number(max) * 100) : 0,
  );
  const [value, setValue] = useState([
    min ? Math.round(Number(min) * 100) : lower,
    max ? Math.round(Number(max) * 100) : upper,
  ]);
  const valid =
    value.every(Number.isFinite) && lower <= upper && value[0] <= value[1];
  if (!valid) return <p>Сбросьте фильтры, чтобы выбрать диапазон цен.</p>;
  return (
    <fieldset className="price-filter">
      <legend>Диапазон цен</legend>
      <div className="price-values">
        <span>{money(value[0])}</span>
        <span>{money(value[1])}</span>
      </div>
      <Range.Root
        value={value}
        min={lower}
        max={upper || 1}
        step={100}
        thumbAlignment="edge"
        disabled={!bounds || lower === upper}
        onValueChange={setValue}
        onValueCommitted={(v) =>
          onChange({
            min: v[0] === bounds?.min ? '' : (v[0] / 100).toFixed(2),
            max: v[1] === bounds?.max ? '' : (v[1] / 100).toFixed(2),
          })
        }
      >
        <Range.Control className="price-control">
          <Range.Track className="price-track">
            <Range.Indicator className="price-indicator" />
          </Range.Track>
          {[0, 1].map((i) => (
            <Range.Thumb
              key={i}
              index={i}
              className="price-thumb"
              getAriaLabel={() =>
                i === 0 ? 'Минимальная цена' : 'Максимальная цена'
              }
              getAriaValueText={(_, v) => money(v)}
            />
          ))}
        </Range.Control>
      </Range.Root>
      <small>
        {!bounds
          ? 'Цены появятся вместе с коллекцией.'
          : lower === upper
            ? 'Все букеты стоят одинаково.'
            : 'Двигайте ползунки или используйте клавиши со стрелками.'}
      </small>
    </fieldset>
  );
}
