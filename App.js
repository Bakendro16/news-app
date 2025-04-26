import { Linking, RefreshControl } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';

const API_KEY = '5e165254d12e40e79677d025e5651712';
const CATEGORIES = ['General', 'Business', 'Entertainment', 'Health', 'Science', 'Sports', 'Technology'];

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('General');
  const [page, setPage] = useState(1);
  const [likedArticles, setLikedArticles] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedArticleUrl, setSelectedArticleUrl] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchNews();
  }, [category, page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category.toLowerCase()}&page=${page}&pageSize=10&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      setNews(page === 1 ? data.articles : [...news, ...data.articles]);
      setLoading(false);
      fadeIn();
    } catch (error) {
      console.error('Ошибка при загрузке новостей:', error);
      setLoading(false);
    }
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleCategoryPress = (cat) => {
    setCategory(cat);
    setPage(1);
    setNews([]);
  };

  const toggleLike = (article) => {
    if (likedArticles.includes(article.url)) {
      setLikedArticles(likedArticles.filter((url) => url !== article.url));
    } else {
      setLikedArticles([...likedArticles, article.url]);
    }
  };

  const filterByDate = (articles) => {
    return articles.filter((article) => {
      if (dateFilter === '24h') {
        const articleDate = new Date(article.publishedAt);
        return articleDate > Date.now() - 24 * 60 * 60 * 1000;
      }
      return true;
    });
  };

  const filteredNews = filterByDate(
    news.filter((item) => item.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // NEW: Рендер плиток (2 в ряд)
  const renderNews = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.newsContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setPage(1);
              fetchNews();
            }}
            colors={['#6A1B9A']}
          />
        }
      >
        {filteredNews.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tile}
            onPress={() => setSelectedArticleUrl(item.url)}
            activeOpacity={0.8}
          >
            {item.urlToImage && (
              <Image source={{ uri: item.urlToImage }} style={styles.tileImage} />
            )}
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
              <TouchableOpacity
                onPress={() => toggleLike(item)}
                style={styles.heartIcon}
              >
                <Icon
                  name={likedArticles.includes(item.url) ? "heart" : "heart-o"}
                  size={18}
                  color={likedArticles.includes(item.url) ? "#FF5C5C" : "#6A1B9A"}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // NEW: Рендер категорий с иконками
  const renderCategory = (cat) => {
    const iconMap = {
      General: 'newspaper-o',
      Business: 'briefcase',
      Entertainment: 'film',
      Health: 'heartbeat',
      Science: 'flask',
      Sports: 'soccer-ball-o',
      Technology: 'cogs',
    };

    return (
      <TouchableOpacity
        key={cat}
        style={[styles.categoryButton, category === cat && styles.activeCategory]}
        onPress={() => handleCategoryPress(cat)}
      >
        <Icon name={iconMap[cat]} size={16} color={category === cat ? '#fff' : '#6A1B9A'} />
        <Text style={[styles.categoryText, category === cat && { color: '#fff' }]}>{cat}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {selectedArticleUrl ? (
        // NEW: Красивый WebView с заголовком
        <View style={{ flex: 1 }}>
          <View style={styles.articleHeader}>
            <TouchableOpacity onPress={() => setSelectedArticleUrl(null)}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.articleHeaderText}>Просмотр статьи</Text>
            <View style={{ width: 20 }} /> // Для выравнивания
          </View>
          <WebView
            source={{ uri: selectedArticleUrl }}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Новости</Text>
          </View>

          <View style={styles.container}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск новостей..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />

            {loading && page === 1 ? (
              <ActivityIndicator size="large" color="#6A1B9A" style={{ marginTop: 20 }} />
            ) : (
              renderNews()
            )}
          </View>

          {/* NEW: Категории внизу экрана */}
          <View style={styles.bottomCategories}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((cat) => renderCategory(cat))}
            </ScrollView>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5', // CHANGED
  },
  header: {
    paddingVertical: 15,
    backgroundColor: '#6A1B9A', // NEW: Фиолетовый
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 70, // NEW: Отступ для категорий
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  // NEW: Стили для плиток
  newsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  tileContent: {
    padding: 10,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  heartIcon: {
    alignSelf: 'flex-end',
  },
  // NEW: Стили для категорий внизу
  bottomCategories: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3E5F5', // NEW: Светло-фиолетовый
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategory: {
    backgroundColor: '#6A1B9A', // NEW: Фиолетовый
  },
  categoryText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#6A1B9A',
  },
  // NEW: Стили для WebView
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#6A1B9A',
  },
  articleHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});