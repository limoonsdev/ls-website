"use client";

import { useState } from "react";
import { secureFetch } from "@/lib/crypto";
import { useSession } from "next-auth/react";
import { Star, Send, CheckCircle } from "lucide-react";
import styles from "./avis.module.css";
import { motion } from "framer-motion";

export default function AvisPage() {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await secureFetch('/api-bot/avis', {
        method: 'POST',
        body: JSON.stringify({
          note: rating,
          commentaire: comment,
          userId: session?.user?.id
        })
      });
      
      if (res.ok) {
        setSuccess(true);
        setComment("");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'envoi de l'avis.");
      }
    } catch(err) {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.container}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.successCard}>
          <CheckCircle size={48} color="#00ff88" />
          <h2>Merci pour votre avis !</h2>
          <p>Votre retour a été publié dans le salon Discord dédié.</p>
          <button className={styles.submitBtn} onClick={() => setSuccess(false)}>Nouveau Message</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={styles.card}>
        <div className={styles.header}>
          <h2><Star className={styles.titleIcon} /> Laissez un Avis</h2>
          <p>Partagez votre expérience avec PrimeGen sur le serveur Discord !</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.ratingContainer}>
            <span>Votre Note :</span>
            <div className={styles.stars}>
              {[1,2,3,4,5].map(star => (
                <Star 
                  key={star}
                  className={`${styles.star} ${(hoverRating || rating) >= star ? styles.starActive : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  fill={(hoverRating || rating) >= star ? "#ffd700" : "none"}
                />
              ))}
            </div>
          </div>

          <textarea 
            className={styles.textarea} 
            value={comment} 
            onChange={(e) => setComment(e.target.value)}
            placeholder="Écrivez votre commentaire ici..."
            rows={5}
            required
          />

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading || !comment.trim()}>
            {loading ? "Envoi..." : <><Send size={16} /> Publier l'Avis</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
