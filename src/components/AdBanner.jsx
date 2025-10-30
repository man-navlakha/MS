import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="w-full   p-4 flex flex-col items-center justify-between gap-3 transition">
      
      <a href="tel:+919913151805" className='bg-gray-300/60 p-3 rounded-xl ' >AD Here [+91 9913151805]</a>

      
      <a
        href="https://pixelclass.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 sm:mt-0 flex flex-col bg-gray-300/60 p-3 rounded-xl items-center gap-2 transition"
      >
        Pixel Class Download Hight Quality Handwritten 
        <p>Assignmenet, Notes, & more...</p>
      <img className='max-w-[120px] w-full ' src="https://ik.imagekit.io/pxc/pixel%20class%20fav%20w-02.png" />
        <p>Ultimate solution for your study</p>
      </a>

      <a  className='bg-gray-300/60 p-3 rounded-xl ' href="tel:+919913151805">AD Here [+91 9913151805]</a>
      <a  className='bg-gray-300/60 p-3 rounded-xl ' href="tel:+919913151805">AD Here [+91 9913151805]</a>
    </div>
  );
}
