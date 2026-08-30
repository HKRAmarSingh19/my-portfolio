import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Intro = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            onComplete();
          }, 500);

          return 100;
        }

        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#030712] text-white">
      
      <div className="flex w-full max-w-3xl flex-col items-center justify-center px-4 text-center">

        <p className="mb-6 font-mono text-sm text-blue-400">
          &gt; initializing portfolio...
        </p>

        <motion.h1
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.3,
      },
    },
  }}
  className="relative whitespace-nowrap text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
>
  {"HKR. AMAR".split("").map((char, index) => (
    <motion.span
      key={index}
      variants={{
        hidden: {
          opacity: 0,
          y: 35,
          filter: "blur(8px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
      className="inline-block"
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  ))}

  <span className="text-blue-500">
    {" SINGH".split("").map((char, index) => (
      <motion.span
        key={index}
        variants={{
          hidden: {
            opacity: 0,
            y: 35,
            filter: "blur(8px)",
          },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </span>
</motion.h1>

        <p className="mt-6 text-lg text-gray-400 md:text-xl">
          Code. Build. <span className="text-blue-500">Solve.</span> Evolve.
        </p>

        <div className="mx-auto mt-10 w-full max-w-2xl">
          <div className="mb-2 flex justify-between font-mono text-xs text-gray-500">
            <span>Loading...</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Welcome to my world.
        </p>

      </div>
    </div>
  );
};

export default Intro;