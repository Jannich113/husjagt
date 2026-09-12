package dk.husjagt.data

import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Public Boligsiden search API. No key.
 * Boligsiden already aggregates home, Nybolig, EDC, danbolig, Estate, etc.
 */
class BoligsidenClient(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .callTimeout(25, TimeUnit.SECONDS)
        .build(),
) {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    fun search(filters: SearchFilters): SearchResult {
        val url = "https://api.boligsiden.dk/search/list/cases".toHttpUrl().newBuilder()
            .addQueryParameter("addressTypes", filters.types.joinToString(","))
            .addQueryParameter("municipalities", filters.municipality)
            .addQueryParameter("sortBy", filters.sortBy)
            .addQueryParameter("sortAscending", filters.sortAscending.toString())
            .addQueryParameter("per_page", filters.perPage.toString())
            .addQueryParameter("page", filters.page.toString())
            .apply {
                filters.priceMax?.let { addQueryParameter("priceMax", it.toString()) }
                filters.priceMin?.let { addQueryParameter("priceMin", it.toString()) }
                filters.roomsMin?.let { addQueryParameter("numberOfRoomsMin", it.toString()) }
                filters.roomsMax?.let { addQueryParameter("numberOfRoomsMax", it.toString()) }
                filters.areaMin?.let { addQueryParameter("areaMin", it.toString()) }
                filters.areaMax?.let { addQueryParameter("areaMax", it.toString()) }
                filters.lotMin?.let { addQueryParameter("lotAreaMin", it.toString()) }
                filters.lotMax?.let { addQueryParameter("lotAreaMax", it.toString()) }
                filters.yearFrom?.let { addQueryParameter("yearBuiltFrom", it.toString()) }
                filters.yearTo?.let { addQueryParameter("yearBuiltTo", it.toString()) }
                if (filters.energyLabels.isNotEmpty()) {
                    addQueryParameter("energyLabels", filters.energyLabels.joinToString(",") { it.uppercase() })
                }
                filters.expenseMax?.let { addQueryParameter("monthlyExpenseMax", it.toString()) }
                filters.daysMax?.let { addQueryParameter("daysListedMax", it.toString()) }
                filters.zipCode
                    ?.filter { it.isDigit() }
                    ?.takeIf { it.length == 4 }
                    ?.let { addQueryParameter("zipCodes", it) }
                filters.city?.trim()?.takeIf { it.isNotEmpty() }?.let { addQueryParameter("cities", it) }
                if (filters.basement) addQueryParameter("basementAreaMin", "1")
                if (filters.balcony) addQueryParameter("balcony", "true")
                if (filters.terrace) addQueryParameter("terrace", "true")
                if (filters.elevator) addQueryParameter("elevator", "true")
            }
            .build()

        val request = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("Accept-Language", "da-DK,da;q=0.9")
            .header("Origin", "https://www.boligsiden.dk")
            .header("Referer", "https://www.boligsiden.dk/")
            .header(
                "User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            )
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                error("Boligsiden ${response.code}: ${body.take(180)}")
            }
            val parsed = json.decodeFromString<BoligsidenSearchResponse>(body)
            val listings = parsed.cases.mapNotNull { it.toListing() }.filter { it.matches(filters) }
            val clientOnly = filters.priceDropOnly || filters.m2PriceMax != null ||
                (filters.minLon != null && filters.minLat != null && filters.maxLon != null && filters.maxLat != null)
            return SearchResult(
                totalHits = if (clientOnly) listings.size else parsed.totalHits,
                listings = listings,
            )
        }
    }

    private fun Listing.matches(filters: SearchFilters): Boolean {
        val minLon = filters.minLon
        val minLat = filters.minLat
        val maxLon = filters.maxLon
        val maxLat = filters.maxLat
        if (minLon != null && minLat != null && maxLon != null && maxLat != null) {
            val lat = lat ?: return false
            val lon = lon ?: return false
            if (lon !in minLon..maxLon || lat !in minLat..maxLat) return false
        }
        if (filters.priceDropOnly && (priceChange == null || priceChange >= -0.5)) return false
        if (filters.m2PriceMax != null && (m2price == null || m2price > filters.m2PriceMax)) return false
        if (filters.energyLabels.isNotEmpty()) {
            val band = energy?.trim()?.uppercase()?.firstOrNull()?.toString()
            if (band == null || band !in filters.energyLabels.map { it.uppercase() }) return false
        }
        val zip = filters.zipCode?.filter { it.isDigit() }
        if (zip != null && zip.length == 4 && this.zip != zip) return false
        val city = filters.city?.trim()?.lowercase()
        if (!city.isNullOrEmpty() && !this.city.lowercase().contains(city)) return false
        return true
    }

    private fun BoligsidenCase.toListing(): Listing? {
        val id = caseID ?: return null
        return Listing(
            id = id,
            type = addressType ?: "villa",
            price = priceCash,
            priceChange = priceChangePercentage,
            area = housingArea,
            lot = lotArea,
            rooms = numberOfRooms,
            energy = energyLabel?.uppercase(),
            year = yearBuilt,
            expense = monthlyExpense,
            m2price = perAreaPrice,
            days = daysListed?.days,
            lat = coordinates?.lat,
            lon = coordinates?.lon,
            image = image?.imageSources?.firstOrNull()?.url,
            agency = realtor?.name,
            street = listOfNotNull(address?.roadName, address?.houseNumber).joinToString(" "),
            city = address?.cityName.orEmpty(),
            zip = address?.zipCode?.toString().orEmpty(),
            slug = slug.orEmpty(),
            slugAddress = slugAddress.orEmpty(),
        )
    }
}
