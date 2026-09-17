import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "#1e2014",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          position: "relative",
        }}
      >
        {/* Mountain shape */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 20L8 4L14 12L20 4L22 20H2Z"
            fill="#9ca56e"
            stroke="#808a52"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        {/* Dot indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "3px",
            right: "3px",
            width: "8px",
            height: "8px",
            backgroundColor: "#9ca56e",
            borderRadius: "50%",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
