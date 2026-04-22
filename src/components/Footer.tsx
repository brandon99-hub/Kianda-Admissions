export default function Footer() {
  return (
    <footer className="bg-white border-t border-outline-variant/10 py-12 px-8 mt-20">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="font-headline text-xl text-primary">Kianda School</span>
          <p className="text-sm text-on-surface-variant">In Veritate et Caritate</p>
        </div>
        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-secondary transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-secondary transition-colors">Contact</a>
        </div>
        <div className="text-xs text-on-surface-variant opacity-60">
          © {new Date().getFullYear()} Kianda School Admissions.
        </div>
      </div>
    </footer>
  );
}
