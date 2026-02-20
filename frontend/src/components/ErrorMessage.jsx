export default function ErrorMessage({
    message = "Something went wrong. Please try again.",
}) {
    return (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
            ⚠ {message}
        </div>
    );
}
