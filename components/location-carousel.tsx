 'use client';
import {useEffect,useRef,useState} from 'react';
import {MapPin,Phone,Clock,ArrowUpRight,ChevronLeft,ChevronRight} from 'lucide-react';
import {useResource} from '@/hooks/use-resource';
import type {StoreLocation} from '@/lib/locations';
import {Button} from './ui/button';
export default function LocationCarousel(){
 const {data,previousData,error,loading,retry}=useResource<{locations:StoreLocation[]}>('/api/locations');
 const viewport=useRef<HTMLDivElement>(null);
 const [index,setIndex]=useState(0);
 const locations=(data || previousData)?.locations || [];
 const locationIds=locations.map(location=>location.id).join(',');
 useEffect(()=>{setIndex(0);if(viewport.current)viewport.current.scrollLeft=0;},[locationIds]);
 const current=Math.min(index,Math.max(0,locations.length-1));
 function go(next:number){const el=viewport.current;if(el)el.scrollTo({left:next*el.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 if(!loading && !error && !locations.length)return null;
 return <section className="home-visit compact-visit" aria-labelledby="visit-heading">
  <div className="home-section-heading"><div><p className="eyebrow">БУДЕМ РАДЫ ВСТРЕЧЕ</p><h2 id="visit-heading">Как нас найти</h2></div>
   {locations.length>1 && <div className="location-controls"><Button variant="ghost" aria-label="Предыдущий адрес" disabled={current===0} onClick={()=>go(current-1)}><ChevronLeft aria-hidden="true"/></Button><span aria-live="polite">{current+1} / {locations.length}</span><Button variant="ghost" aria-label="Следующий адрес" disabled={current===locations.length-1} onClick={()=>go(current+1)}><ChevronRight aria-hidden="true"/></Button></div>}
  </div>
  {loading && !locations.length && <p role="status">Загружаем адреса…</p>}
  {error && <div role="alert"><p>Не удалось загрузить адреса.</p><Button variant="outline" onClick={retry}>Повторить</Button></div>}
  <div ref={viewport} className="location-viewport" role="region" aria-label="Адреса магазинов" aria-roledescription={locations.length>1?'карусель':undefined} onScroll={e=>setIndex(Math.round(e.currentTarget.scrollLeft/e.currentTarget.clientWidth))}>
   {locations.map((location,i)=><article className="location-slide" key={location.id} aria-label={`${i+1} из ${locations.length}`} inert={locations.length>1 && current!==i}>
    <div className="location-card"><div className="location-icon"><MapPin aria-hidden="true"/></div><div className="location-copy"><h3>{location.name}</h3><p>{location.address}</p>
      <div className="location-meta">{location.hours && <span><Clock size={16} aria-hidden="true"/>{location.hours}</span>}{location.phone && <a href={`tel:${location.phone.replace(/[^+0-9]/g,'')}`}><Phone size={16} aria-hidden="true"/>{location.phone}</a>}</div>
      {location.mapUrl && <a className="location-map-link" href={location.mapUrl} target="_blank" rel="noopener noreferrer">Открыть в 2ГИС <ArrowUpRight size={16} aria-hidden="true"/></a>}
    </div></div>
   </article>)}
  </div>
 </section>;
}
