const variants = {
    pdf: "bg-red-100 text-red-800",
    ppt: "bg-orange-100 text-orange-800",
    doc: "bg-blue-100 text-blue-800",
    image: "bg-purple-100 text-purple-800",
    url: "bg-gray-100 text-gray-700",
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
    new: "bg-accent text-white",
    hod: "bg-primary text-white",
    faculty: "bg-blue-100 text-blue-800",
    student: "bg-gray-100 text-gray-700",
};

export default function Badge({ type, label }) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${variants[type] || "bg-gray-100 text-gray-700"}`}
        >
            {label || type}
        </span>
    );
}
