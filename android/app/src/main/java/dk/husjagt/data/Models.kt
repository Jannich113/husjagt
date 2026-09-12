package dk.husjagt.data

import kotlinx.serialization.Serializable

data class SearchFilters(
    val municipality: String = "odense",
    val types: List<String> = listOf("villa", "terraced house", "cooperative"),
    val priceMax: Int? = 2_000_000,
    val priceMin: Int? = null,
    val roomsMin: Int? = null,
    val areaMin: Int? = null,
    val sortBy: String = "price",
    val sortAscending: Boolean = true,
    val page: Int = 1,
    val perPage: Int = 50,
    val minLon: Double? = null,
    val minLat: Double? = null,
    val maxLon: Double? = null,
    val maxLat: Double? = null,
)

data class Listing(
    val id: String,
    val type: String,
    val price: Int?,
    val priceChange: Double?,
    val area: Int?,
    val lot: Int?,
    val rooms: Int?,
    val energy: String?,
    val year: Int?,
    val expense: Int?,
    val m2price: Int?,
    val days: Int?,
    val lat: Double?,
    val lon: Double?,
    val image: String?,
    val agency: String?,
    val street: String,
    val city: String,
    val zip: String,
    val slug: String,
    val slugAddress: String,
) {
    val boligsidenUrl: String
        get() = if (slugAddress.isNotBlank()) {
            "https://www.boligsiden.dk/adresse/$slugAddress"
        } else {
            "https://www.boligsiden.dk/udbud/$slug"
        }
}

data class SearchResult(
    val totalHits: Int,
    val listings: List<Listing>,
)

data class Kommune(val slug: String, val name: String)

object PropertyTypes {
    val all = listOf(
        "villa" to "Villa",
        "terraced house" to "Rækkehus",
        "cooperative" to "Andelsbolig",
        "condo" to "Ejerlejlighed",
        "villa apartment" to "Villalejlighed",
        "holiday house" to "Fritidshus",
        "farm" to "Landejendom",
        "hobby farm" to "Hobbyejendom",
    )
}

@Serializable
data class BoligsidenSearchResponse(
    val cases: List<BoligsidenCase> = emptyList(),
    val totalHits: Int = 0,
)

@Serializable
data class BoligsidenCase(
    val caseID: String? = null,
    val addressType: String? = null,
    val priceCash: Int? = null,
    val priceChangePercentage: Double? = null,
    val housingArea: Int? = null,
    val lotArea: Int? = null,
    val numberOfRooms: Int? = null,
    val energyLabel: String? = null,
    val yearBuilt: Int? = null,
    val monthlyExpense: Int? = null,
    val perAreaPrice: Int? = null,
    val slug: String? = null,
    val slugAddress: String? = null,
    val coordinates: BoligsidenCoords? = null,
    val daysListed: BoligsidenDays? = null,
    val image: BoligsidenImage? = null,
    val address: BoligsidenAddress? = null,
    val realtor: BoligsidenRealtor? = null,
)

@Serializable
data class BoligsidenCoords(val lat: Double? = null, val lon: Double? = null)

@Serializable
data class BoligsidenDays(val days: Int? = null)

@Serializable
data class BoligsidenImage(val imageSources: List<BoligsidenImageSource> = emptyList())

@Serializable
data class BoligsidenImageSource(val url: String? = null)

@Serializable
data class BoligsidenAddress(
    val roadName: String? = null,
    val houseNumber: String? = null,
    val cityName: String? = null,
    val zipCode: Int? = null,
)

@Serializable
data class BoligsidenRealtor(val name: String? = null)
