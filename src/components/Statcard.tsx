interface StatCardProps {
  title: string;
  value: string;
  color: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">

      <p className="text-slate-500">
        {title}
      </p>

      <h3 className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </h3>

    </div>
  );
}

export default StatCard;