import React, { useEffect, useRef } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    const particles: Particle[] = [];
    const particleCount = 150;
    let animationFrameId: number;

    class Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      opacity: number;
      opacitySpeed: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * 4 + 1;
        this.color = this.generateGradientColor();
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.opacitySpeed = Math.random() * 0.01 + 0.005;
      }

      generateGradientColor() {
        const colors = [
          'rgba(255, 165, 0, 0.7)',   // Orange
          'rgba(255, 99, 71, 0.7)',   // Tomato
          'rgba(255, 215, 0, 0.7)',   // Gold
          'rgba(255, 140, 0, 0.7)',   // Dark Orange
          'rgba(255, 69, 0, 0.7)'     // Red-Orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('0.7', String(this.opacity));
        ctx.fill();
        ctx.closePath();
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > canvasWidth) this.speedX *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.speedY *= -1;

        // Opacity oscillation
        this.opacity += this.opacitySpeed;
        if (this.opacity > 0.7 || this.opacity < 0.2) {
          this.opacitySpeed *= -1;
        }
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      resizeCanvas();
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a soft gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 165, 0, 0.1)');   // Light Orange
      gradient.addColorStop(1, 'rgba(255, 99, 71, 0.1)');   // Soft Red
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.draw(ctx);
        particle.update(canvas.width, canvas.height);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[-1] opacity-50" 
    />
  );
};

export default AnimatedBackground;