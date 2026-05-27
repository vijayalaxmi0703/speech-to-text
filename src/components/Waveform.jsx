export default function Waveform({ bars = [1, 2, 3, 4, 5, 4, 3] }) {
  return (
    <div className="flex items-end gap-[4px]">
      {bars.map((height, index) => (
        <span
          key={index}
          className="wave-bar inline-block w-[4px] rounded-full bg-gradient-to-t from-rose-400 via-fuchsia-400 to-violet-300"
          style={{
            height: `${height * 12}px`,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
