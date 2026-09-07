export default function LoadingScreen({ hiding = false }: { hiding?: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FBF9F2',
        overflow: 'hidden',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.45s ease',
        pointerEvents: hiding ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes jbFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes jbSwingA {
          0%, 100% { transform: rotate(-7deg); }
          50%      { transform: rotate(7deg); }
        }
        @keyframes jbSwingB {
          0%, 100% { transform: rotate(6deg); }
          50%      { transform: rotate(-6deg); }
        }

        .jb-logo-wrap {
          position: relative;
          width: min(480px, 90vw);
          aspect-ratio: 810 / 885;
          opacity: 0;
          animation: jbFadeIn 0.9s ease-out forwards;
        }

        .jb-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        /* sunflower + cookie sit exactly where they are in the original artwork,
           pivoting from their top edge like they're dangling and swaying gently */
        .jb-swing {
          position: absolute;
          transform-origin: 50% 0%;
          will-change: transform;
        }

        .jb-sunflower {
          left: 48.426%;
          top: 28.051%;
          width: 11.019%;
          animation: jbSwingA 2.6s ease-in-out infinite;
        }

        .jb-cookie {
          left: 62.5%;
          top: 23.4%;
          width: 14.167%;
          animation: jbSwingB 2.3s ease-in-out infinite;
          animation-delay: .15s;
        }

        .jb-swing img {
          width: 100%;
          display: block;
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.12));
        }

        @media (prefers-reduced-motion: reduce) {
          .jb-swing { animation: none !important; }
          .jb-logo-wrap { animation: none !important; opacity: 1; }
        }
      `}</style>

      <div className="jb-logo-wrap">
        <img className="jb-bg" src="/loading/logo.webp" alt="Jiri Bakes" />
        <div className="jb-swing jb-sunflower"><img src="/loading/sunflower.webp" alt="" /></div>
        <div className="jb-swing jb-cookie"><img src="/loading/cookie.webp" alt="" /></div>
      </div>
    </div>
  );
}
