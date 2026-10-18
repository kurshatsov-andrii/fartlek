import {createFileRoute} from '@tanstack/react-router';
import {pageHead} from '@/lib/route-head';
import StartPlanner from '@/pages/StartPlanner';
export const Route=createFileRoute('/compare')({head:()=>pageHead({title:'Порівняння забігів і стартів | Фартлек',description:'Порівняйте дати, міста, дистанції та відомі ціни обраних спортивних стартів.',path:'/compare',noindex:true}),component:()=> <StartPlanner mode="compare"/>});
