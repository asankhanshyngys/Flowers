 'use client';
import {useRef,useState} from 'react';
import {Plus,X,Pencil} from 'lucide-react';
import {useResource} from '@/hooks/use-resource';
import {apiError,apiJson} from '@/lib/api-error';
import type {StoreLocation} from '@/lib/locations';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
const blank:StoreLocation={id:'',name:'',address:'',phone:'',hours:'',mapUrl:'',coordinates:'',active:1,displayOrder:0,version:0};
export default function AdminLocations(){
 const resource=useResource<{locations:StoreLocation[]}>('/api/admin/locations');
 const [editing,setEditing]=useState<StoreLocation|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const focus=useRef<HTMLElement|null>(null);
 function edit(value:StoreLocation){focus.current=document.activeElement as HTMLElement;setMessage('');setEditing({...value});}
 return <section className="admin-section">
  <div className="locations-admin-heading"><h2>Адреса магазинов</h2><Button onClick={()=>edit(blank)}><Plus aria-hidden="true"/>Добавить адрес</Button></div>
  <p>Добавьте адреса ваших магазинов. Несколько адресов появятся в карусели.</p>
  {message && !editing && <p role="status" className="admin-message">{message}</p>}
  {resource.loading && <p role="status">Загружаем адреса…</p>}
  {resource.error && <div role="alert"><p>{resource.error}</p><Button onClick={resource.retry}>Повторить</Button></div>}
  {resource.data?.locations.length===0 && <p>Адресов пока нет.</p>}
  {resource.data?.locations.map(location=><div className="admin-row" key={location.id}><div><strong>{location.name}</strong><p>{location.address} · {location.active?'На сайте':'Скрыт'}</p></div><Button variant="outline" aria-label={`Изменить адрес: ${location.name}`} onClick={()=>edit(location)}><Pencil aria-hidden="true"/>Изменить</Button></div>)}
  <Dialog open={!!editing} onOpenChange={open=>{if(!open&&!busy)setEditing(null);}}>
   {editing && <DialogContent className="admin-editor" finalFocus={focus} showCloseButton={false}>
    <div className="admin-editor-heading"><div><DialogTitle>{editing.version?'Редактировать адрес':'Новый адрес'}</DialogTitle><DialogDescription>Сохраните адрес, чтобы он появился на главной странице.</DialogDescription></div><Button variant="ghost" disabled={busy} aria-label="Закрыть редактор" onClick={()=>setEditing(null)}><X/></Button></div>
    <form className="admin-form" onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy(true);setMessage('');try{
      const {id,version,...values}=editing;
      const response=await fetch(`/api/admin/locations${version?'/'+id:''}`,{method:version?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,active:!!values.active,...(version?{version}:{})})});
      const data=await apiJson(response);if(!response.ok)throw new Error(apiError(data,'Не удалось сохранить адрес.'));
      setEditing(null);setMessage('Адрес сохранён.');resource.retry();
    }catch(error){setMessage(error instanceof Error?error.message:'Не удалось сохранить адрес.');}finally{setBusy(false);}}}>
     {([['name','Название магазина',120,true],['address','Адрес',300,true],['phone','Телефон',40,false],['hours','Часы работы',160,false],['mapUrl','Ссылка на 2ГИС',2048,false],['coordinates','Координаты метки',80,false]] as const).map(([key,label,max,required])=><label key={key} htmlFor={`location-${key}`}>{label}<Input id={`location-${key}`} type={key==='mapUrl'?'url':key==='phone'?'tel':'text'} required={required} maxLength={max} disabled={busy} value={editing[key]} onChange={e=>setEditing({...editing,[key]:e.target.value})}/>{key==='coordinates'&&<small>Широта, долгота. Например: 51.14245, 71.420112. Скопируйте координаты точки из карты.</small>}{key==='mapUrl'&&<small>Ссылка для открытия маршрута в 2ГИС.</small>}</label>)}
     <label htmlFor="location-order">Порядок показа<Input id="location-order" type="number" min={0} max={1000000} step={1} required disabled={busy} value={editing.displayOrder} onChange={e=>setEditing({...editing,displayOrder:e.target.valueAsNumber})}/><small>Меньшее число — раньше в списке.</small></label>
     <label className="check-label"><input type="checkbox" checked={!!editing.active} disabled={busy} onChange={e=>setEditing({...editing,active:Number(e.target.checked)})}/>Показывать на сайте</label>
     {message && <p role="alert" className="location-form-message">{message}</p>}
     <div className="admin-actions"><Button type="submit" disabled={busy}>{busy?'Сохраняем…':'Сохранить адрес'}</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>setEditing(null)}>Отмена</Button></div>
    </form>
   </DialogContent>}
  </Dialog>
 </section>;
}
